"""Prezentacja w jednym pliku: samodzielny HTML i PDF do wysłania (Slack, mail, oddanie).

index.html ściąga style, skrypty, zrzuty i logotypy z sąsiednich plików, a font z Google Fonts,
więc wysłany sam nie działa. Ten skrypt wpisuje wszystko do jednego pliku HTML (font Archivo
z font/, obrazy jako data:), a potem robi z niego PDF: strona na slajd, demo „Dzień Kasi”
krok po kroku. PDF podgląda Slack i każdy telefon, HTML zostaje z animacjami i strzałkami.

Plik do oddania (regulamin: numerWyzwania_nazwaDrużyny_nazwaProjektu) to samodzielny HTML
w docs/pitch/. Skrypt nadpisuje go przy każdym uruchomieniu, więc po zmianie slajdów wystarczy
go puścić i scommitować wynik.

Z katalogu repozytorium:

    python -I docs/pitch/prezentacja/build_standalone.py            # HTML + PDF
    python -I docs/pitch/prezentacja/build_standalone.py --bez-pdf  # tylko HTML

PDF wymaga pakietu playwright dla Pythona i Chromium (`python -m playwright install chromium`).
Wynik: docs/pitch/3_AISlopers_przezornyObywatel.html (w repo) oraz HTML i PDF w
docs/pitch/prezentacja/dist/ (w .gitignore).
"""

import argparse
import base64
import re
import sys
from pathlib import Path

KATALOG = Path(__file__).resolve().parent
DIST = KATALOG / "dist"
# Wyzwanie 3, zespół AI Slopers, projekt Przezorny Obywatel
NAZWA = "3_AISlopers_przezornyObywatel"
ODDANIE = KATALOG.parent / f"{NAZWA}.html"

TYPY = {".jpg": "image/jpeg", ".png": "image/png", ".svg": "image/svg+xml", ".woff2": "font/woff2"}

# Zakresy znaków jak w CSS Google Fonts dla Archivo (wdth 62–125, wght 100–900)
FONTY = [
    ("archivo-latin-ext.woff2", "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF"),
    ("archivo-latin.woff2", "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD"),
]


def data_uri(sciezka: Path) -> str:
    return f"data:{TYPY[sciezka.suffix]};base64," + base64.b64encode(sciezka.read_bytes()).decode()


def zamien(tekst: str, stare: str, nowe: str) -> str:
    if tekst.count(stare) != 1:
        sys.exit(f"Oczekiwano dokładnie jednego wystąpienia: {stare!r} (jest {tekst.count(stare)})")
    return tekst.replace(stare, nowe)


def skrypt(js: str) -> str:
    return "<script>\n" + js.replace("</script", "<\\/script") + "\n</script>"


def zbuduj_html() -> Path:
    html = (KATALOG / "index.html").read_text(encoding="utf-8")

    # Font: trzy linki do Google Fonts → @font-face z plikami z font/
    fonty = "\n".join(
        "@font-face { font-family: 'Archivo'; font-style: normal; font-weight: 100 900; font-stretch: 62% 125%;"
        f" font-display: block; src: url({data_uri(KATALOG / 'font' / plik)}) format('woff2'); unicode-range: {zakres}; }}"
        for plik, zakres in FONTY
    )
    html = re.sub(r'<link rel="preconnect"[^>]*>\n', "", html)
    html = zamien(html, '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,100..900&display=swap">',
                  f"<style>\n{fonty}\n</style>")

    css = (KATALOG / "telefon.css").read_text(encoding="utf-8")
    html = zamien(html, '<link rel="stylesheet" href="telefon.css">', f"<style>\n{css}\n</style>")

    # Zrzuty telefonu: telefon.js składa ścieżkę 'ekrany/' + nazwa + '.jpg', więc podajemy mapę nazwa → data:
    telefon = (KATALOG / "telefon.js").read_text(encoding="utf-8")
    telefon, ile = re.subn(r"'ekrany/' \+ ([\w.]+) \+ '\.jpg'", r"window.EKRANY[\1]", telefon)
    if ile != 2:
        sys.exit(f"telefon.js: oczekiwano 2 ścieżek do ekrany/, jest {ile}")
    ekrany = {p.stem: data_uri(p) for p in sorted((KATALOG / "ekrany").glob("*.jpg"))}
    mapa = "window.EKRANY = {\n" + ",\n".join(f"  {k!r}: {v!r}" for k, v in ekrany.items()) + "\n};"

    dane = (KATALOG / "dane.js").read_text(encoding="utf-8")
    html = zamien(html, '<script src="dane.js"></script>', skrypt(dane))
    html = zamien(html, '<script src="telefon.js"></script>', skrypt(mapa) + "\n" + skrypt(telefon))

    # Logotypy i kod QR (img src i <image href> w SVG)
    html = re.sub(r'(src|href)="((?:logo|qr)/[^"]+)"', lambda m: f'{m[1]}="{data_uri(KATALOG / m[2])}"', html)

    zostalo = re.findall(r'(?:src|href)="(?!data:|https?:|#)[^"]*"', html)
    if zostalo:
        sys.exit(f"Zostały odwołania do plików obok: {zostalo}")

    DIST.mkdir(exist_ok=True)
    wynik = DIST / f"{NAZWA}.html"
    wynik.write_text(html, encoding="utf-8")
    ODDANIE.write_text(html, encoding="utf-8")
    return wynik


def zbuduj_pdf(html: Path) -> Path:
    from playwright.sync_api import sync_playwright

    W, H = 1600, 900
    strony = []
    with sync_playwright() as p:
        przegladarka = p.chromium.launch()
        karta = przegladarka.new_page(viewport={"width": W, "height": H}, device_scale_factor=1.5, reduced_motion="reduce")
        karta.goto(html.as_uri())
        karta.evaluate("document.fonts.ready")
        karta.add_style_tag(content=".nawig, .notatki { display: none !important; }")
        slajdy = karta.evaluate("[...document.querySelectorAll('.slajd:not([data-pomin])')].map(s => [s.id, Number(s.dataset.kroki || 0)])")
        for nr, (sid, kroki) in enumerate(slajdy, start=1):
            if sid == "s-kasia":
                stany = range(kroki + 1)  # demo: każdy krok to osobna strona
            elif sid == "s-syreny":
                stany = [0, 1]  # przed i po wyłączeniu prądu
            elif sid == "s-slopers":
                stany = [0]  # krok 1 wygasza telewizor
            else:
                stany = [kroki]  # wszystkie linijki widoczne
            for k in stany:
                karta.evaluate(f"location.hash = '#{nr}.{k}'")
                karta.wait_for_timeout(900)
                strony.append(base64.b64encode(karta.screenshot(type="jpeg", quality=88)).decode())
        print(f"{len(slajdy)} slajdów, {len(strony)} stron PDF")

        obrazy = "".join(f'<img src="data:image/jpeg;base64,{s}">' for s in strony)
        karta.set_content(
            f"<style>@page {{ size: {W}px {H}px; margin: 0 }} * {{ margin: 0 }}"
            f" img {{ display: block; width: {W}px; height: {H}px; break-after: page }}</style>{obrazy}"
        )
        wynik = DIST / f"{NAZWA}.pdf"
        karta.pdf(path=str(wynik), width=f"{W}px", height=f"{H}px", print_background=True)
        przegladarka.close()
    return wynik


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--bez-pdf", action="store_true", help="tylko samodzielny HTML")
    args = parser.parse_args()
    html = zbuduj_html()
    print(f"{html} ({html.stat().st_size / 1e6:.1f} MB)")
    if not args.bez_pdf:
        pdf = zbuduj_pdf(html)
        print(f"{pdf} ({pdf.stat().st_size / 1e6:.1f} MB)")
