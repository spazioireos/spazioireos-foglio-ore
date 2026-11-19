# Collaudo

Qui vanno gli script di prova di quest'app e quello che serve a ricostruire il banco (stesso schema di
`ore-mensili-dipendenti/collaudo/`): il contenitore in cui lavora Claude può essere ricreato in qualunque
momento e resta solo quello che è su GitHub.

**Solo dati INVENTATI**: il repository è pubblico. I dati veri stanno nella cartella privata di Google Drive «Dati collaudo Spazio Ireos».

Gli script delle revisioni precedenti sono andati persi con il contenitore il 15-19/11/2026: vanno
ricostruiti qui la prossima volta che si tocca quest'app.

## Script del collaudo di Livello A del 19/11/2026 (rev 17)

Girano sul banco comune con finta Firebase (`rendicontazione-usoint/collaudo/comune`, porta 8340).
`fo-a00-comune.cjs` è il modulo comune; esiti in `collaudo/out/` (non si salva).

| script | esito sulla rev 17 |
|---|---|
| `fo-a01-accesso.cjs` | 25/27 |
| `fo-a02-ore-bande.cjs` | 32/33 |
| `fo-a03-admin.cjs` | 33/38 |
| `fo-a04-grafica.cjs` | 50/50 |
| `fo-a05-servizi-unico-light.cjs` | 18/22 |
| `fo-a06-limiti.cjs` | 5/10 |
| `fo-a07-quadri.cjs` | 8/8 |

I falliti sono difetti preesistenti segnalati a Christian, o limiti dichiarati della finta Firebase.

## Rev 18 (19/11/2026): `fo-rev18.cjs` e la batteria rieseguita

`fo-rev18.cjs` prova le cinque correzioni della rev 18 con il **confronto diretto** sulla rev 17
congelata, che va servita dal banco in `/fo17/index.html` (copia della rev 17 passata da
`rendicontazione-usoint/collaudo/comune/localizza.py`):

```bash
git show 902ea1b:index.html > /tmp/fo17.html     # la rev 17
python3 ../rendicontazione-usoint/collaudo/comune/localizza.py /tmp/fo17.html \
        ../rendicontazione-usoint/collaudo/comune/.banco/fo17/index.html
PORTA=8341 node collaudo/fo-rev18.cjs              # 41/41 sulla rev 18
```

`fo-a00-comune.cjs` esporta ora `REV`, letta dalla costante `FO_REV` del file dell'app: A01 e C14
non invecchiano più a ogni revisione.

| script | rev 17 | rev 18 |
|---|---|---|
| `fo-a01-accesso.cjs` | 25/27 | 25/27 |
| `fo-a02-ore-bande.cjs` | 32/33 | 33/33 |
| `fo-a03-admin.cjs` | 33/38 | 35/38 |
| `fo-a04-grafica.cjs` | 50/50 | 50/50 |
| `fo-a05-servizi-unico-light.cjs` | 18/22 | 19/22 |
| `fo-a06-limiti.cjs` | 5/10 | 10/10 |
| `fo-a07-quadri.cjs` | 8/8 | 8/8 |
| `fo-rev18.cjs` | — | 41/41 |
