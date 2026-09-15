# Iteracja UX: kalkulator i wybór roku

- Kalkulator: ciemny panel dat, limonkowy wynik, kolorowe propozycje i wybór limitu 1/3/5/10 dni urlopu. Wybranie propozycji wypełnia daty i przenosi do wyniku. CTA prowadzą do kalendarza i propozycji bieżącego roku.
- Sugestie porównują ciągłe okresy zaczynające się najwcześniej w dniu wizyty, w bieżącym roku, z możliwością zakończenia w styczniu. Najpierw wybierana jest największa długość, następnie mniejszy koszt urlopu. Datę builda zapisujemy w HTML, a po hydratacji aktualizujemy do daty w Polsce.
- Strona główna: nowy landing w stylu kalkulatora — duża typografia, limonkowa i ciemna karta wyboru bieżącego/następnego roku, krótka instrukcja i dodatkowe wejście do kalkulatora niżej. Główne CTA nadal prowadzą do roczników. Wspólne menu zapewnia dostęp do bieżącego kalendarza i kalkulatora.
- Copy kalkulatora rozwija markę „nie robię”: „Nie robię. To się opłaca.”, „Kiedy nie robisz?”, „Mniej urlopu. Więcej «nie robię»”. Etykiety dat, jednostki wyników, metodę obliczeń i FAQ zachowano wprost.
- Rocznik: usunięte breadcrumbs, wprowadzenie i spis sekcji nad statystykami. H1 jest teraz nagłówkiem samego kalendarza. Breadcrumbs nie występują na żadnej stronie — usunięto również BreadcrumbList z JSON-LD.
- FAQ: nowe pytania o wybór terminów, majówkę, Boże Ciało, dłuższe wyjazdy, odbiór wolnego i granicę roku. Roczne odpowiedzi zawierają konkretne daty do wniosku i osobny zakres wypoczynku. Zasady odbioru mają odnośnik do PIP.

## Kontrola

Typecheck, 111 testów jednostkowych i 9 przeglądarkowych zaliczone. Build tworzy 112 stron; kontrola statycznego SEO i identyczności HTML w czterech strefach czasowych przechodzi. Sprawdzono desktop i mobile (320–1440 px), w tym pełnoroczny, trzycyfrowy wynik kalkulatora. Wynik zawija etykietę, a dekoracja landingu znika na najmniejszych ekranach, żeby nie zasłaniać treści.

Obaj niezależni recenzenci zgłosili ten sam problem niepełnego zbioru kandydatów. Generator został zastąpiony pełnym przeglądem dopuszczalnych początków i końców z limitem do 10 dni roboczych. Kontrprzykłady objęto regresjami, a code reviewer niezależnie sprawdził 24 kombinacje względem pełnego przeliczenia. Obaj zamknęli uwagi.

Końcowy przegląd kolejnej iteracji landingu i copy: SEO reviewer bez materialnych uwag. Code reviewer wykrył nakładanie dekoracji i przycięcie trzycyfrowego wyniku na ekranie 320 px; obie poprawki potwierdził ponownie w przeglądarce. Brak otwartych uwag.

Zmiany pozostają lokalnie, bez publikacji.

## Lifting widoku roku

- Zachowano kolejność sekcji, trzy kafle podsumowania, siatkę miesięcy, legendę, filtry, osie czasu i rozwijanie strategii.
- Wspólna paleta z landingiem i kalkulatorem: grafit, limonka, fiolet, lila i brzoskwinia. Logo, wybór roku, przełącznik, obramowania, stemple i przyciski używają tego samego stylu. Skala A–G zachowuje rozpoznawalne kolory oceny.
- Bilans wolnego ma limonkowe tło. Urlop i mostki otrzymały brzoskwiniowe oznaczenia, święta — fioletowe; kolory odpowiadają legendzie i osiom czasu.
- Poniżej strategii FAQ ma osobny panel nagłówka i karty odpowiedzi; odświeżono kafle liczb roku oraz tabelę świąt. Treść odpowiedzi i danych pozostaje taka sama.
- Filtry zachowują działanie; dodano powiązania etykiet suwaków i stan aria-pressed przy przyciskach.

Walidacja liftingu: typecheck i 111 testów jednostkowych zaliczone; komplet 9 scenariuszy e2e przeszedł, a po ostatniej korekcie tooltipu dodatkowo ponowiono scenariusz szerokości dla lat 2026/2027 przy 320, 390 i 768 px. Build generuje 112 stron, kontrola SEO i czterech stref czasowych przechodzi. Kontrola wizualna obejmowała desktop, mobile, rozwinięte strategie i FAQ. Code review oraz przegląd SEO zakończone bez otwartych uwag.
