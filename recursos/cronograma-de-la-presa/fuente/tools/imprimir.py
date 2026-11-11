import sys, asyncio, json
from playwright.async_api import async_playwright
# uso: imprimir.py entrada.html salida.pdf
async def main():
    entrada, salida = sys.argv[1], sys.argv[2]
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        pg = await b.new_page()
        errores = []
        pg.on('console', lambda m: errores.append(f'{m.type}: {m.text}') if m.type in ('error', 'warning') else None)
        pg.on('pageerror', lambda e: errores.append(f'pageerror: {e}'))
        await pg.goto('file://' + entrada)
        await pg.evaluate('document.fonts.ready')
        await pg.wait_for_function('window.__paginado !== false', timeout=20000)
        await pg.wait_for_timeout(400)
        # control de desbordes: cuerpos de página y celdas
        rep = await pg.evaluate('''() => {
          const out = [];
          document.querySelectorAll('section.pagina, .cartel').forEach((pg, i) => { const c = pg.matches('.cartel') ? pg : pg.querySelector('.cuerpo'); if (c && c.scrollHeight > c.clientHeight + 1) out.push('pagina ' + (i + 1) + ' desborda ' + (c.scrollHeight - c.clientHeight) + 'px'); });
          document.querySelectorAll('.c').forEach(c => { if (c.scrollWidth > c.clientWidth + 1) out.push('celda ancha: ' + c.textContent.slice(0, 40)); });
          const fuentes = [...document.fonts].filter(f => f.status === 'loaded').map(f => f.family + ' ' + f.weight + ' ' + f.style);
          return { out, fuentes, paginas: document.querySelectorAll('section.pagina').length };
        }''')
        await pg.pdf(path=salida, prefer_css_page_size=True, print_background=True)
        print(json.dumps({'paginas': rep['paginas'], 'errores': errores, 'desbordes': rep['out']}, ensure_ascii=False))
        await b.close()
asyncio.run(main())
