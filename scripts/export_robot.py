"""Export Open Duck Mini v2 + a recorded walking rollout for the web hero.

Inputs (read-only): the user's 부기 project (MuJoCo xmls, hi-res STLs, rollout npz).
Output: duck.json + duck.bin in the portfolio's public/robot/.

- hi-res STLs are decimated, swapped into a copy of the playground xmls, compiled by MuJoCo
- a seamless loop is cut from the straight-walking part of the rollout
- the base is re-expressed on a "treadmill": heading aligned to +X, forward drift removed
- per frame: world pose of every visual geom, leg joint anchors/frames/angles
"""

import json
import shutil
import struct
import sys
from pathlib import Path

import fast_simplification
import mujoco
import numpy as np

BUGI = Path.home() / "부기"
PLAY = BUGI / "external/Open_Duck_Playground/playground/open_duck_mini_v2/xmls"
HIRES = BUGI / "external/Open_Duck_Mini/mini_bdx/robots/open_duck_mini_v2"
NPZ = BUGI / "sim/out/duck_walk_BEST_WALK_ONNX_2.npz"
WORK = Path(sys.argv[1])
OUT = Path(sys.argv[2])
TARGET_RATIO = 0.17
FPS = 30

LEG = ["hip_yaw", "hip_roll", "hip_pitch", "knee", "ankle"]
LEG_JOINTS = [f"{s}_{j}" for s in ("left", "right") for j in LEG]


def read_stl(p):
    b = p.read_bytes()
    n = struct.unpack("<I", b[80:84])[0]
    a = np.frombuffer(b[84 : 84 + 50 * n], dtype=np.dtype([("n", "<f4", 3), ("v", "<f4", (3, 3)), ("a", "<u2")]))
    v = a["v"].reshape(-1, 3).astype(np.float64)
    key = np.round(v / 1e-6).astype(np.int64)
    uniq, inv = np.unique(key, axis=0, return_inverse=True)
    verts = np.zeros((len(uniq), 3))
    verts[inv.ravel()] = v
    faces = inv.reshape(-1, 3)
    faces = faces[(faces[:, 0] != faces[:, 1]) & (faces[:, 1] != faces[:, 2]) & (faces[:, 0] != faces[:, 2])]
    return verts, faces


def write_stl(p, verts, faces):
    tri = verts[faces].astype(np.float32)
    nrm = np.cross(tri[:, 1] - tri[:, 0], tri[:, 2] - tri[:, 0])
    nrm /= np.linalg.norm(nrm, axis=1, keepdims=True) + 1e-12
    rec = np.zeros(len(faces), dtype=np.dtype([("n", "<f4", 3), ("v", "<f4", (3, 3)), ("a", "<u2")]))
    rec["n"] = nrm
    rec["v"] = tri
    p.write_bytes(b"\0" * 80 + struct.pack("<I", len(faces)) + rec.tobytes())


def build_model():
    if WORK.exists():
        shutil.rmtree(WORK)
    shutil.copytree(PLAY, WORK)
    before = after = 0
    for stl in sorted((WORK / "assets").glob("*.stl")):
        src = HIRES / stl.name
        if not src.exists():
            continue
        v, f = read_stl(src)
        before += len(f)
        if len(f) > 400:
            v, f = fast_simplification.simplify(v.astype(np.float32), f.astype(np.int64), target_reduction=1 - TARGET_RATIO)
        after += len(f)
        write_stl(stl, np.asarray(v, dtype=np.float64), np.asarray(f))
    print(f"triangles {before} -> {after}")
    return mujoco.MjModel.from_xml_path(str(WORK / "scene_flat_terrain.xml"))


def quat_mul(a, b):
    w1, x1, y1, z1 = a
    w2, x2, y2, z2 = b
    return np.array([
        w1 * w2 - x1 * x2 - y1 * y2 - z1 * z2,
        w1 * x2 + x1 * w2 + y1 * z2 - z1 * y2,
        w1 * y2 - x1 * z2 + y1 * w2 + z1 * x2,
        w1 * z2 + x1 * y2 - y1 * x2 + z1 * w2,
    ])


def yaw_of(q):
    w, x, y, z = q
    return np.arctan2(2 * (w * z + x * y), 1 - 2 * (y * y + z * z))


def mat2quat(mat9):
    q = np.zeros(4)
    mujoco.mju_mat2Quat(q, np.asarray(mat9, dtype=np.float64))
    return q


def main():
    m = build_model()
    d = mujoco.MjData(m)
    z = np.load(NPZ, allow_pickle=False)
    t, base, joints, names = z["t"], z["base"], z["joints"], list(z["names"])

    # seamless loop inside the straight-walking window (cmd 0.15 m/s from 1.5 s to 8.5 s)
    a = int(np.searchsorted(t, 3.0))
    best = None
    for k in range(120, 175):
        if a + k + 1 >= len(t) or t[a + k] > 8.4:
            break
        err = np.linalg.norm(joints[a] - joints[a + k]) + np.linalg.norm(joints[a + 1] - joints[a + k + 1])
        if best is None or err < best[0]:
            best = (err, k)
    k = best[1]
    idx = np.arange(a, a + k)
    print(f"loop frames {a}..{a + k} ({k / FPS:.2f}s), seam error {best[0]:.4f} rad")

    # treadmill: align heading to +X, remove the linear forward drift
    pos = base[idx, :3].copy()
    quat = base[idx, 3:7].copy()
    yaws = np.unwrap([yaw_of(q) for q in quat])
    heading = float(np.mean(yaws))
    c, s = np.cos(-heading), np.sin(-heading)
    rot = np.array([[c, -s, 0], [s, c, 0], [0, 0, 1]])
    qrot = np.array([np.cos(-heading / 2), 0, 0, np.sin(-heading / 2)])
    pos = pos @ rot.T
    i = np.arange(k)
    fit_x = np.polyfit(i, pos[:, 0], 1)
    fit_y = np.polyfit(i, pos[:, 1], 1)
    speed = float(fit_x[0] * FPS)
    pos[:, 0] -= np.polyval(fit_x, i)
    pos[:, 1] -= np.polyval(fit_y, i)
    quat = np.array([quat_mul(qrot, q) for q in quat])
    print(f"heading {np.degrees(heading):.1f} deg, treadmill speed {speed:.3f} m/s")

    vis = [g for g in range(m.ngeom) if m.geom_type[g] == mujoco.mjtGeom.mjGEOM_MESH and m.geom_group[g] == 2]
    meshes = sorted({int(m.geom_dataid[g]) for g in vis})
    jid = [m.joint(n).id for n in LEG_JOINTS]

    frames = np.zeros((k, len(vis), 7), np.float32)
    jframes = np.zeros((k, len(jid), 7), np.float32)
    angles = np.zeros((k, len(jid)), np.float32)
    for f, src in enumerate(idx):
        d.qpos[:] = m.qpos0
        d.qpos[0:3] = pos[f]
        d.qpos[3:7] = quat[f]
        for n, val in zip(names, joints[src]):
            d.qpos[m.jnt_qposadr[m.joint(str(n)).id]] = val
        mujoco.mj_kinematics(m, d)
        for gi, g in enumerate(vis):
            frames[f, gi, :3] = d.geom_xpos[g]
            frames[f, gi, 3:] = mat2quat(d.geom_xmat[g])
        for ji, j in enumerate(jid):
            body = m.jnt_bodyid[j]
            jframes[f, ji, :3] = d.xanchor[j]
            jframes[f, ji, 3:] = mat2quat(d.xmat[body])
            angles[f, ji] = np.degrees(d.qpos[m.jnt_qposadr[j]])

    # binary layout: per mesh float32 verts + uint16/uint32 faces, then frame blocks
    blob = bytearray()
    mesh_meta = []
    tris = 0
    for mi in meshes:
        va, vn = m.mesh_vertadr[mi], m.mesh_vertnum[mi]
        fa, fn = m.mesh_faceadr[mi], m.mesh_facenum[mi]
        v = m.mesh_vert[va : va + vn].astype(np.float32)
        f = m.mesh_face[fa : fa + fn]
        tris += fn
        idx_t = np.uint16 if vn < 65536 else np.uint32
        while len(blob) % 4:
            blob.append(0)
        vo = len(blob)
        blob += v.tobytes()
        fo = len(blob)
        blob += f.astype(idx_t).tobytes()
        mesh_meta.append({"name": m.mesh(mi).name, "v": [vo, int(vn)], "f": [fo, int(fn)], "u32": idx_t is np.uint32})
    while len(blob) % 4:
        blob.append(0)
    fo = len(blob)
    blob += frames.tobytes()
    jo = len(blob)
    blob += jframes.tobytes()
    ao = len(blob)
    blob += angles.tobytes()

    lo = float(frames[:, :, 2].min())
    hi = float(frames[:, :, 2].max())
    meta = {
        "source": "Open Duck Mini v2 (Apache-2.0) · BEST_WALK_ONNX_2 rollout in MuJoCo",
        "fps": FPS,
        "frames": int(k),
        "treadmillSpeed": speed,
        "height": hi,
        "groundZ": 0.0,
        "meshes": mesh_meta,
        "geoms": [{"mesh": meshes.index(int(m.geom_dataid[g])), "body": m.body(m.geom_bodyid[g]).name} for g in vis],
        "joints": LEG_JOINTS,
        "offsets": {"frames": fo, "jointFrames": jo, "angles": ao},
        "triangles": int(tris),
    }
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "duck.bin").write_bytes(bytes(blob))
    (OUT / "duck.json").write_text(json.dumps(meta, ensure_ascii=False))
    print(f"wrote {len(blob) / 1024:.0f} KB, {len(vis)} geoms, {len(meshes)} meshes, {tris} tris, z {lo:.3f}..{hi:.3f}")


if __name__ == "__main__":
    main()
