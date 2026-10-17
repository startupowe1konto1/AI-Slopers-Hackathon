from syreny.podsumowanie import podsumuj


def test_podsumuj_miasto_i_dzielnice():
    # n: wszystkie syreny, b: blackout (przybliżony tam, gdzie p = 1), dolne oszacowanie: 0 tam, gdzie p = 1
    t = podsumuj(n="3210", b="3100", p="0110", dzielnice=["Wola", "Wola", "Ursus", "Ursus"])
    m = t.loc["Warszawa"]
    assert (m.adresy, m.normalnie_65, m.blackout_65, m.blackout_65_dolne) == (4, 75.0, 50.0, 25.0)
    assert (m.traci_zasieg, m.traci_zasieg_dolne, m.normalnie_75, m.blackout_75) == (1, 2, 25.0, 25.0)
    assert t.loc["Ursus"].blackout_65 == 0.0 and t.loc["Wola"].blackout_65 == 100.0
