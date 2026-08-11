const boxes = [...document.querySelectorAll('.symptom input')];
const count = document.getElementById('count');
const result = document.getElementById('result');
const disease = document.getElementById('disease');
const confidenceBar = document.getElementById('confidenceBar');
const confidenceText = document.getElementById('confidenceText');
const message = document.getElementById('message');
const topPredictions = document.getElementById('topPredictions');

function updateCount(){
  count.textContent = boxes.filter(b => b.checked).length;
}

boxes.forEach(b => b.addEventListener('change', updateCount));

document.getElementById('search').addEventListener('input', e => {
  const q = e.target.value.toLowerCase();
  document.querySelectorAll('.symptom').forEach(el => {
    el.style.display = el.dataset.name.includes(q) ? '' : 'none';
  });
});

document.getElementById('clearBtn').addEventListener('click', () => {
  boxes.forEach(b => b.checked = false);
  updateCount();
  result.classList.add('hidden');
});

document.getElementById('predictBtn').addEventListener('click', async () => {
  const symptoms = boxes.filter(b => b.checked).map(b => b.value);
  if (!symptoms.length) {
    alert('Please select at least one symptom.');
    return;
  }

  const btn = document.getElementById('predictBtn');
  btn.disabled = true;
  btn.textContent = 'Analyzing...';

  try {
    const res = await fetch('/predict', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({symptoms})
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Prediction failed');

    disease.textContent = data.disease.replaceAll('_',' ');
    confidenceBar.style.width = `${data.confidence}%`;
    confidenceText.textContent = `Model confidence: ${data.confidence}%`;
    message.textContent = data.message;

    topPredictions.innerHTML = data.top_predictions.map(x =>
      `<div class="top-item"><span>${x.disease.replaceAll('_',' ')}</span><strong>${x.confidence}%</strong></div>`
    ).join('');

    result.classList.remove('hidden');
    result.scrollIntoView({behavior:'smooth', block:'center'});
  } catch (err) {
    alert(err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Predict Possible Disease';
  }
});

updateCount();
