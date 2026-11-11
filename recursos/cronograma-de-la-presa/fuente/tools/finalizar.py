"""Arma los PDF finales: metadatos, compresión sin pérdida y nombres para el sitio.

Uso, desde la raíz de esta carpeta:  python3 tools/finalizar.py
Lee out/build/anexo-asamblea.pdf, out/build/anexo-fondos.pdf y out/build/cartel.pdf
y escribe en out/ los tres PDF con el nombre que usa la página del sitio.
"""
import os
import subprocess
from pypdf import PdfReader, PdfWriter

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
AUTOR = 'Laboratorio de Desarrollo Rural, Universidad Autónoma de Querétaro'
TEMA = 'Habilitación de la orilla de la Presa de La Florida, Arroyo Seco, Querétaro'
PARES = [
    ('anexo-asamblea.pdf', 'cronograma-presa-asamblea.pdf', 'Cronograma hipotético del anteproyecto de la Presa de La Florida. Versión para la asamblea ejidal'),
    ('anexo-fondos.pdf', 'cronograma-presa-fondos.pdf', 'Cronograma hipotético del anteproyecto de la Presa de La Florida. Versión completa para las instancias de financiamiento'),
    ('cartel.pdf', 'cronograma-presa-cartel-90x60.pdf', 'El cronograma de la presa. Cartel de pared, 90 × 60 cm'),
]

for origen, destino, titulo in PARES:
    entrada = os.path.join(RAIZ, 'out', 'build', origen)
    salida = os.path.join(RAIZ, 'out', destino)
    temporal = salida + '.tmp'
    lector, escritor = PdfReader(entrada), PdfWriter()
    for pagina in lector.pages:
        escritor.add_page(pagina)
    escritor.add_metadata({'/Title': titulo, '/Author': AUTOR, '/Subject': TEMA, '/Creator': 'Laboratorio de Desarrollo Rural'})
    with open(temporal, 'wb') as f:
        escritor.write(f)
    subprocess.run(['qpdf', '--object-streams=generate', '--recompress-flate', '--compression-level=9', temporal, salida], check=True)
    os.remove(temporal)
    print(destino, len(lector.pages), 'páginas')
