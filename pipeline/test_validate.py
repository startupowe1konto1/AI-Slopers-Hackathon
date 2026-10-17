import json
from validate import bledy


def zapisz(pack, sciezka, dane):
    f = pack / sciezka
    f.parent.mkdir(parents=True, exist_ok=True)
    f.write_text(json.dumps(dane, ensure_ascii=False), encoding="utf-8", newline="\n")


def manifest(pack):
    pliki = [{"sciezka": f.relative_to(pack).as_posix(), "bajty": f.stat().st_size, "modul": f.parent.name}
             for f in sorted(pack.glob("*/*")) if f.is_file()]
    zapisz(pack, "manifest.json", {"wersja": "t", "zbudowano": "t", "pliki": pliki, "zrodla": {}})


META = {"modul": "adresy", "rekordy": 2, "zrodla": {"wfs-adresy": {"nazwa": "x", "licencja": "CC BY", "url": "u", "pobrano": "p"}}}


def paczka(tmp_path, lon=(21.0, 21.1), syreny=None):
    zapisz(tmp_path, "adresy/adresy.json", {"id": ["1", "2"], "lat": [52.2, 52.3], "lon": list(lon)})
    zapisz(tmp_path, "adresy/meta.json", META)
    if syreny is not None:
        zapisz(tmp_path, "syreny/syreny.json", syreny)
        zapisz(tmp_path, "syreny/meta.json", {**META, "modul": "syreny"})
    manifest(tmp_path)
    return tmp_path


def test_poprawna_paczka(tmp_path):
    assert bledy(paczka(tmp_path, syreny={"n": "31", "b": "20"})) == []


def test_brak_pliku_z_manifestu(tmp_path):
    p = paczka(tmp_path)
    (p / "adresy/adresy.json").unlink()
    assert any("adresy/adresy.json" in b for b in bledy(p))


def test_plik_spoza_manifestu(tmp_path):
    p = paczka(tmp_path)
    zapisz(p, "adresy/nowy.json", [])
    assert any("adresy/nowy.json" in b and "manife" in b for b in bledy(p))


def test_rozmiar_inny_niz_w_manifescie(tmp_path):
    p = paczka(tmp_path)
    zapisz(p, "adresy/adresy.json", {"id": ["1", "2", "3"], "lat": [52.2, 52.3, 52.3], "lon": [21.0, 21.1, 21.1]})
    assert any("adresy/adresy.json" in b and "rozmiar" in b for b in bledy(p))


def test_folder_bez_meta(tmp_path):
    p = paczka(tmp_path)
    zapisz(p, "punkty/punkty.json", [])
    manifest(p)
    assert any("punkty" in b and "meta.json" in b for b in bledy(p))


def test_punkt_poza_warszawa_w_formacie_kolumnowym_i_liscie(tmp_path):
    p = paczka(tmp_path, lon=(21.0, 19.9))
    zapisz(p, "transport/przystanki.json", [{"id": "s", "lat": 50.0, "lon": 21.0}])
    zapisz(p, "transport/meta.json", {**META, "modul": "transport"})
    manifest(p)
    b = bledy(p)
    assert any("adresy/adresy.json" in x and "poza" in x for x in b)
    assert any("transport/przystanki.json" in x and "poza" in x for x in b)


def test_syreny_niezgodne_z_adresami(tmp_path):
    assert any("syreny" in b for b in bledy(paczka(tmp_path, syreny={"n": "3", "b": "2"})))
    assert any("syreny" in b for b in bledy(paczka(tmp_path, syreny={"n": "39", "b": "20"})))
