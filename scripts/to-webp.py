"""Convert generated PNGs in scripts/.art-raw to compact WebP files in public/art/."""
from pathlib import Path

from PIL import Image

here = Path(__file__).parent
dst = here.parent / "public" / "art"
dst.mkdir(parents=True, exist_ok=True)

# Prefer FLUX renders (.art-flux) over SDXL (.art-raw) when both exist
sources = {p.stem: p for p in (here / ".art-raw").glob("*.png")}
sources.update({p.stem: p for p in (here / ".art-flux").glob("*.png")})

total = 0
for png in sorted(sources.values(), key=lambda p: p.stem):
    out = dst / f"{png.stem}.webp"
    img = Image.open(png).convert("RGB")
    # Theme wallpapers stay full size; covers are shown smaller, so shrink them
    if not png.stem.startswith("theme-"):
        img.thumbnail((960, 960))
    img.save(out, "WEBP", quality=78, method=6)
    total += out.stat().st_size
    print(f"{out.name}: {out.stat().st_size // 1024} KB")
print(f"total {total // 1024} KB")
