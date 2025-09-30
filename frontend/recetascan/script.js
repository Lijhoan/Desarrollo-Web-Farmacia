const transcribedTextarea = document.getElementById('transcribed-text');const transcribedTextarea = document.getElementById('transcribed-text');

const validateButton = document.getElementById('validate');const validateButton = document.getElementById('validate');

const normalizeButton = document.getElementById('normalize');const normalizeButton = document.getElementById('normalize');

const resultsSection = document.getElementById('results');const resultsSection = document.getElementById('results');

const medicationResultsDiv = document.getElementById('medication-results');const medicationResultsDiv = document.getElementById('medication-results');

const correctionSection = document.getElementById('correction-section');

const manualCorrectionTextarea = document.getElementById('manual-correction');function extractMeds(text){

const validateCorrectedButton = document.getElementById('validate-corrected');  return text.split(/\n|,|\./).map(s=>s.trim()).filter(Boolean);

const cancelCorrectionButton = document.getElementById('cancel-correction');}

const correctionButtons = document.getElementById('correction-buttons');

validateButton.addEventListener('click', async()=>{

// Función para mostrar resultados de medicamentos  const text = transcribedTextarea.value.trim();

function mostrarResultados(resultados) {  if(!text){ alert('No hay texto para validar.'); return; }

  medicationResultsDiv.innerHTML = '';  resultsSection.style.display='block';

    medicationResultsDiv.innerHTML='<p>Validando...</p>';

  if (!resultados || resultados.length === 0) {  try{

    medicationResultsDiv.innerHTML = '<p class="text-warning">⚠️ No se encontraron medicamentos</p>';    const meds = extractMeds(text);

    return;    const res = await fetch('http://localhost:3000/validar-stock',{

  }      method:'POST', headers:{'Content-Type':'application/json'},

        body: JSON.stringify({medicamentos: meds})

  resultados.forEach(r => {    });

    const card = document.createElement('div');    if(!res.ok) throw new Error('Error en validar-stock');

    card.className = `card p-2 resultado ${r.disponible ? 'disponible' : 'no-disponible'}`;    const data = await res.json();

        medicationResultsDiv.innerHTML='';

    let contenido = `<strong>${r.nombre}</strong> ${r.disponible ? '✔️ Disponible' : '❌ Sin stock'}`;    data.forEach(med=>{

          const el = document.createElement('div');

    if (r.disponible && r.detalles && r.detalles.length > 0) {      el.className = `card p-2 ${med.disponible?'disponible':'no-disponible'}`;

      const detalle = r.detalles[0];      el.innerHTML = `<strong>${med.nombre}</strong> ${med.disponible?'✔️ Disponible':'❌ Sin stock'}`;

      if (detalle.stock) contenido += `<br><span>📦 Stock: ${detalle.stock} unidades</span>`;      medicationResultsDiv.appendChild(el);

      if (detalle.costo) contenido += `<br><span>💲 Precio: $${detalle.costo.toFixed(2)}</span>`;    });

      if (detalle.marca) contenido += `<br><span>🏷️ Marca: ${detalle.marca}</span>`;  }catch(e){ console.error(e); medicationResultsDiv.innerHTML='<p class="text-danger">Error validando el stock.</p>'; }

    }});

    

    card.innerHTML = contenido;normalizeButton.addEventListener('click', async()=>{

    medicationResultsDiv.appendChild(card);  const text = transcribedTextarea.value.trim();

  });  if(!text){ alert('No hay texto para normalizar.'); return; }

}  resultsSection.style.display='block';

  medicationResultsDiv.innerHTML='<p>Consultando IA...</p>';

// Handler para botón Validar con base de datos  try{

validateButton.addEventListener('click', async () => {    const res = await fetch('http://localhost:3000/normalizar-receta',{

  const text = transcribedTextarea.value.trim();      method:'POST', headers:{'Content-Type':'application/json'},

        body: JSON.stringify({texto: text})

  if (!text) {    });

    alert('No hay texto para validar.');    if(!res.ok) throw new Error('Error en normalizar-receta');

    return;    const normalizedText = await res.json();

  }    const normBox = document.createElement('div');

      normBox.className='card p-2 sugerencia';

  resultsSection.style.display = 'block';    normBox.innerHTML = `<em>Sugerencia IA:</em> ${normalizedText}`;

  medicationResultsDiv.innerHTML = '<p>Validando...</p>';    medicationResultsDiv.innerHTML='';

      medicationResultsDiv.appendChild(normBox);

  try {

    // Dividir el texto en líneas para extraer medicamentos    const meds = extractMeds(normalizedText);

    const medicamentos = text.split('\n')    const res2 = await fetch('http://localhost:3000/validar-stock',{

      .map(line => line.trim())      method:'POST', headers:{'Content-Type':'application/json'},

      .filter(line => line.length > 0);      body: JSON.stringify({medicamentos: meds})

        });

    const response = await fetch('http://localhost:3000/validar-stock', {    if(!res2.ok) throw new Error('Error en validar-stock');

      method: 'POST',    const data2 = await res2.json();

      headers: { 'Content-Type': 'application/json' },    data2.forEach(med=>{

      body: JSON.stringify({ medicamentos })      const el=document.createElement('div');

    });      el.className=`card p-2 ${med.disponible?'disponible':'no-disponible'}`;

          el.innerHTML=`<strong>${med.nombre}</strong> ${med.disponible?'✔️ Disponible':'❌ Sin stock'}`;

    if (!response.ok) throw new Error('Error validando stock');      medicationResultsDiv.appendChild(el);

        });

    const data = await response.json();  }catch(e){ console.error(e); medicationResultsDiv.innerHTML='<p class="text-danger">Error con la IA o la validación.</p>'; }

    mostrarResultados(data);});

  } catch(e) { 

    medicationResultsDiv.innerHTML = '<p class="text-danger">Error validando el stock.</p>'; 
  }
});

// Handler para botón Normalizar con IA
normalizeButton.addEventListener('click', async () => {
  const texto = transcribedTextarea.value.trim();
  
  if (!texto) {
    alert('No hay texto para normalizar.');
    return;
  }

  resultsSection.style.display = 'block';
  medicationResultsDiv.innerHTML = '<p>⏳ Consultando IA...</p>';

  try {
    const response = await fetch('http://localhost:3000/normalizar-receta', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texto }),
    });
    
    const data = await response.json();

    if (data.error) {
      alert('Error: ' + data.error);
      medicationResultsDiv.innerHTML = `<p class="text-danger">❌ ${data.error}</p>`;
      return;
    }

    // Verificar que tenemos los datos esperados
    if (!data.normalizado || !Array.isArray(data.normalizado)) {
      medicationResultsDiv.innerHTML = '<p class="text-danger">❌ Respuesta inesperada de la IA</p>';
      return;
    }

    // ✨ NUEVO FLUJO: Mostrar en caja de edición en lugar de validar directamente
    manualCorrectionTextarea.value = data.normalizado.join('\n');
    
    // Mostrar sección de corrección manual
    correctionSection.style.display = 'block';
    correctionButtons.style.display = 'flex';
    
    // Mostrar mensaje de guía
    medicationResultsDiv.innerHTML = `
      <div class="alert alert-info">
        <h5>✏️ Texto normalizado por IA</h5>
        <p>La IA ha procesado el texto. Puedes editarlo en la caja de arriba antes de validar:</p>
        <ul>
          <li>Elimina medicamentos incorrectos</li>
          <li>Corrige nombres mal detectados</li>
          <li>Agrega medicamentos que falten</li>
        </ul>
        <p><strong>Cuando esté listo, presiona "✔️ Validar texto corregido"</strong></p>
      </div>
    `;

  } catch (err) {
    medicationResultsDiv.innerHTML = '<p class="text-danger">❌ Error en la normalización con IA</p>';
  }
});

// Handler para escaneo OCR
const recipeImageInput = document.getElementById('recipe-image');
const scanButton = document.getElementById('scan-button');

// Funcionalidad OCR con Tesseract.js
scanButton.addEventListener('click', async () => {
  const file = recipeImageInput.files[0];
  if (!file) {
    alert('Por favor selecciona una imagen primero.');
    return;
  }

  resultsSection.style.display = 'block';
  medicationResultsDiv.innerHTML = '<p>⏳ Escaneando imagen...</p>';

  try {
    const { data: { text } } = await Tesseract.recognize(file, 'spa', {
      logger: info => console.log(info) // progreso en consola
    });

    // Mostrar texto en el textarea automáticamente
    transcribedTextarea.value = text;
    medicationResultsDiv.innerHTML = `<p>Texto detectado:</p><pre>${text}</pre>`;
  } catch (e) {
    medicationResultsDiv.innerHTML = '<p class="text-danger">❌ Error al escanear la imagen.</p>';
  }
});

// Handler para validar texto corregido
validateCorrectedButton.addEventListener('click', async () => {
  const correctedText = manualCorrectionTextarea.value.trim();
  
  if (!correctedText) {
    alert('No hay texto corregido para validar.');
    return;
  }
  
  medicationResultsDiv.innerHTML = '<p>⏳ Validando texto corregido...</p>';

  try {
    const response = await fetch('http://localhost:3000/normalizar-receta', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texto: correctedText })
    });

    if (!response.ok) throw new Error('Error en validación de texto corregido');

    const data = await response.json();

    // Mostrar resultados usando la función auxiliar
    mostrarResultados(data.resultados);
    
    // Actualizar textarea principal con medicamentos finales
    transcribedTextarea.value = data.normalizado.join('\n');
    
  } catch (err) {
    medicationResultsDiv.innerHTML = '<p class="text-danger">❌ Error al validar el texto corregido</p>';
  }
});

// Handler para cancelar corrección
cancelCorrectionButton.addEventListener('click', () => {
  // Ocultar sección de corrección
  correctionSection.style.display = 'none';
  correctionButtons.style.display = 'none';
  
  // Limpiar textarea de corrección
  manualCorrectionTextarea.value = '';
});