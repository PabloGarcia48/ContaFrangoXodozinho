# ContaFrango

Aplicacao simples em HTML, CSS e JavaScript para controlar produtos e quantidades em duas paginas sincronizadas:

- `index.html`: pagina de controle
- `visualizacao.html`: pagina de visualizacao em tempo real

## Como usar

Voce pode abrir as paginas direto no navegador, mas o mais confiavel e usar um servidor local simples:

```bash
python3 -m http.server 8000
```

Depois abra no navegador:

- `http://localhost:8000/index.html`
- `http://localhost:8000/visualizacao.html`

## Como funciona

- Os produtos ficam salvos localmente no navegador
- A pagina de visualizacao atualiza automaticamente quando a lista muda
- Nao precisa de banco de dados nem backend
