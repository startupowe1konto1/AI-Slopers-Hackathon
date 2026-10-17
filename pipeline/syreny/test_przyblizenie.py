import numpy as np
from syreny.przyblizenie import dopasuj_spadek, kalibruj_poprawke, klasa_db, poziom_max


def test_klasa_db_progi():
    assert klasa_db(np.array([50, 64.99, 65, 69.9, 70, 74.9, 75, 99])).tolist() == [0, 0, 1, 1, 2, 2, 3, 3]


def test_dopasuj_spadek_odzyskuje_wspolny_spadek_i_poziomy_klas():
    d = np.tile([50.0, 100, 200, 400, 600], 2)
    klasy = np.repeat([109.0, 115.0], 5)
    L = np.where(klasy == 115, 128.0, 122.0) - 18.5 * np.log10(d)
    B, A = dopasuj_spadek(d, L, klasy)
    assert abs(B + 18.5) < 1e-9
    assert abs(A[115.0] - 128.0) < 1e-9 and abs(A[109.0] - 122.0) < 1e-9


def test_poziom_max_bierze_najglosniejsza_syrene_i_minimum_30_m():
    px, py = np.array([0.0, 1000.0]), np.array([0.0, 0.0])
    sx, sy, A = np.array([0.0, 1100.0]), np.array([0.0, 0.0]), np.array([120.0, 130.0])
    L = poziom_max(px, py, sx, sy, A, B=-20.0)
    assert abs(L[0] - (120 - 20 * np.log10(30))) < 1e-9  # punkt na syrenie: odległość liczona jako 30 m
    assert abs(L[1] - (130 - 20 * np.log10(100))) < 1e-9  # bliższa i głośniejsza z dwóch


def test_kalibruj_poprawke_wyrownuje_udzial_zasiegu_z_modelem():
    L = np.array([60.0, 66, 68, 71, 73, 80])
    wzor = np.array([0, 0, 1, 1, 2, 3])  # SOIA: 4 z 6 adresów >= 65 dB
    p = kalibruj_poprawke(L, wzor, krok=0.05)
    assert np.mean(klasa_db(L - p) > 0) == np.mean(wzor > 0)
    assert 1.0 <= p <= 3.0  # najmniejsza poprawka, która spycha 66 dB poniżej 65, a 68 dB zostawia
