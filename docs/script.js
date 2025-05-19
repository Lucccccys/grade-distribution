const CHATGPT_API_URL = 'https://grade-proxy.grade-distribution.workers.dev/openai/chat-completions';

document.getElementById('analyze-dist-btn').addEventListener('click', async () => {
  const fileInput = document.getElementById('syllabus-file');
  if (!fileInput.files.length) return alert('Please select a syllabus file first.');
  
  const text = await fileInput.files[0].text();     // Assume plain text upload
  const prompt = `
Please extract the grade distribution information from the following syllabus text and format it as a JSON array:
[
  { "item": "Assignment1", "Percentage": 10%, "max_score": 100 },
  ...
]
  
Syllabus Content:
${text}
  `;
  
  // Call ChatGPT API
  const response = await fetch(CHATGPT_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0
    })
  });
  const data = await response.json();
  const dist = JSON.parse(data.choices[0].message.content.trim());
  
  // Display in table
  const tbody = document.querySelector('#dist-table tbody');
  tbody.innerHTML = '';
  dist.forEach(d => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${d.item}</td><td>${d.weight}</td><td>${d.max_score}</td>`;
    tbody.appendChild(tr);
  });
  document.getElementById('distribution-section').style.display = '';
  document.getElementById('calculator-section').style.display = '';
  
  // Save distribution data globally for later calculations
  window.gradeDist = dist;
});

document.getElementById('calc-required-btn').addEventListener('click', () => {
  if (!window.gradeDist) return;
  const current = parseFloat(document.getElementById('current-score').value);
  const target  = parseFloat(document.getElementById('target-score').value);
  if (isNaN(current) || isNaN(target)) return alert('Please enter valid numbers.');
  
  // Assuming the target is a percentage of the total score
  const totalWeight = window.gradeDist.reduce((sum,d)=> sum + d.weight, 0);
  const earnedWeight = (current / 100) * totalWeight;
  const remainingWeight = totalWeight - earnedWeight;
  const needWeight = target - earnedWeight;
  
  const perPercent = needWeight / remainingWeight * 100;
  // perPercent% * max_score
  const results = window.gradeDist.map(d => {
    const req = (perPercent/100) * d.max_score;
    return { item: d.item, required: req.toFixed(1) };
  });
  
  // Display required scores
  const div = document.getElementById('required-results');
  div.innerHTML = `<strong>You need to score an average of ${perPercent.toFixed(1)}% in the remaining items. Required scores:</strong>
    <ul>${results.map(r=>`<li>${r.item}: ${r.required}</li>`).join('')}</ul>`;
  
  document.getElementById('plan-section').style.display = '';
  
  // Trigger study plan analysis
  fetchStudyPlan(results);
});

async function fetchStudyPlan(results) {
  const weaknessPrompt = `
Based on the following required scores and syllabus distribution, analyze my weak areas and suggest study/review plans for the remaining items.

Distribution and required scores:
${results.map(r=>`${r.item} requires ${r.required} points`).join('\n')}
  
Please provide:
1. My possible weak areas (e.g., Assignment3 focuses on Chapter X)
2. Review strategies and study plans for each remaining item (daily or weekly arrangements)
  `;
  
  const res = await fetch(CHATGPT_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: weaknessPrompt }],
      temperature: 0.7
    })
  });
  const planData = await res.json();
  const planText = planData.choices[0].message.content;
  
  document.getElementById('study-plan').innerText = planText;
}
