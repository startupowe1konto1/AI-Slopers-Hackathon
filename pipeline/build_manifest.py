import json
from datetime import datetime, timezone
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
PACK = ROOT / "public/pack"
pliki, zrodla = [], {}
for meta in sorted(PACK.glob("*/meta.json")):
    m = json.loads(meta.read_text(encoding="utf-8"))
    zrodla.update(m["zrodla"])
    for f in sorted(meta.parent.glob("*")):
        pliki.append({"sciezka": f.relative_to(PACK).as_posix(), "bajty": f.stat().st_size, "modul": m["modul"]})
teraz = datetime.now(timezone.utc).isoformat(timespec="seconds")
(PACK / "manifest.json").write_text(json.dumps(
    {"wersja": teraz[:16], "zbudowano": teraz, "pliki": pliki, "zrodla": zrodla}, ensure_ascii=False, indent=1), encoding="utf-8", newline="\n")
print(len(pliki), "plików")
