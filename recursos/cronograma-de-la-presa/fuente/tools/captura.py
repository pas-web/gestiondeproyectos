import sys, asyncio, json
from playwright.async_api import async_playwright
# uso: captura.py archivo.html salida.png ancho alto [acciones_js] [esquema]
async def main():
    archivo, salida, w, h = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4])
    js = sys.argv[5] if len(sys.argv) > 5 else ''
    esquema = sys.argv[6] if len(sys.argv) > 6 else 'light'
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        pg = await b.new_page(viewport={'width': w, 'height': h}, device_scale_factor=1, color_scheme=esquema)
        errores = []
        pg.on('console', lambda m: errores.append(f'{m.type}: {m.text}') if m.type in ('error', 'warning') else None)
        pg.on('pageerror', lambda e: errores.append(f'pageerror: {e}'))
        await pg.goto('file://' + archivo)
        await pg.wait_for_function('window.__listo === true', timeout=10000)
        if js:
            await pg.evaluate(js)
            await pg.wait_for_timeout(900)
        await pg.wait_for_timeout(300)
        await pg.screenshot(path=salida, full_page=False)
        print(json.dumps(errores, ensure_ascii=False))
        await b.close()
asyncio.run(main())
