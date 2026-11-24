const RIASEC_LABELS = {
  realistic: 'Realistic',
  investigative: 'Investigative',
  artistic: 'Artistic',
  social: 'Social',
  enterprising: 'Enterprising',
  conventional: 'Conventional'
};

const APTITUDE_LABELS = {
  logical: 'Logical',
  numerical: 'Numerical',
  verbal: 'Verbal'
};

const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const safeFilename = (value) =>
  String(value || 'Student')
    .normalize('NFKD')
    .replace(/[^a-zA-Z0-9_-]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 48) || 'Student';

const formatDate = (value) => {
  if (!value) return 'Not available';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not available';
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  }).format(date);
};

const scoreRows = (scores, labels) =>
  Object.entries(labels)
    .map(([key, label]) => {
      const score = Number(scores?.[key] ?? 0);
      const safeScore = Number.isFinite(score) ? score : 0;
      const width = Math.max(0, Math.min(100, safeScore / (key === 'logical' || key === 'numerical' || key === 'verbal' ? 2 : 10) * 100));
      return `
        <div class="score-row">
          <div class="score-heading"><span>${escapeHtml(label)}</span><strong>${escapeHtml(safeScore)}</strong></div>
          <div class="track"><span style="width:${width}%"></span></div>
        </div>`;
    })
    .join('');

const recommendationCards = (recommendations) => {
  if (!Array.isArray(recommendations) || recommendations.length === 0) {
    return '<p class="muted">No career recommendations were saved for this assessment.</p>';
  }

  return recommendations.map((item, index) => {
    const courses = Array.isArray(item.courses) ? item.courses : [];
    const courseList = courses.length
      ? `<div class="course-list"><strong>Suggested courses</strong><ul>${courses.map((course) => `
          <li>${escapeHtml(course.title || 'Course')}${course.provider ? ` · ${escapeHtml(course.provider)}` : ''}${course.link ? `<br><span class="course-link">${escapeHtml(course.link)}</span>` : ''}</li>
        `).join('')}</ul></div>`
      : '';

    return `
      <article class="career-card">
        <div class="career-heading">
          <span class="rank">${index + 1}</span>
          <h3>${escapeHtml(item.careerTitle || 'Career option')}</h3>
          <span class="match">${escapeHtml(item.matchPercentage ?? '—')}% match</span>
        </div>
        <p>${escapeHtml(item.explanation || 'No explanation was saved for this recommendation.')}</p>
        ${courseList}
      </article>`;
  }).join('');
};

const buildReportHtml = ({ assessment, student }) => {
  const name = student?.name || 'Student';
  const assessmentDate = formatDate(assessment.completedAt || assessment.createdAt);
  const assessmentId = assessment._id || 'Not available';
  const riasecScores = assessment.riasecScores || {};
  const aptitudeScores = assessment.aptitudeScores || {};
  const provider = assessment.aiProvider || 'Not available';

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>PathFinder Career Assessment Report</title>
<style>
  @page { size: A4; margin: 16mm 14mm; }
  * { box-sizing: border-box; }
  body { margin: 0; color: #172033; font-family: Arial, Helvetica, sans-serif; font-size: 10.5pt; line-height: 1.5; }
  .brand { display: flex; align-items: center; gap: 9px; color: #4338ca; font-size: 17pt; font-weight: 800; letter-spacing: -.4px; }
  .brand-mark { width: 8px; height: 25px; border-radius: 5px; background: #4f46e5; display: inline-block; }
  .hero { margin: 24px 0 20px; padding: 22px; border-radius: 14px; color: #fff; background: #27245f; }
  .eyebrow { color: #c7d2fe; text-transform: uppercase; font-size: 8pt; font-weight: 700; letter-spacing: 1.5px; }
  h1 { margin: 7px 0 5px; font-size: 25pt; line-height: 1.15; }
  .hero p { margin: 0; color: #e0e7ff; }
  .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 18px; }
  .meta div { border: 1px solid rgba(255,255,255,.2); border-radius: 8px; padding: 9px 11px; }
  .meta small { display: block; color: #c7d2fe; font-size: 7.5pt; text-transform: uppercase; letter-spacing: .8px; }
  .meta strong { display: block; overflow-wrap: anywhere; }
  h2 { margin: 23px 0 10px; padding-bottom: 6px; border-bottom: 1px solid #e5e7eb; color: #25245f; font-size: 14pt; }
  h3 { margin: 0; font-size: 11pt; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
  .score-row { margin: 11px 0; }
  .score-heading { display: flex; justify-content: space-between; gap: 12px; font-size: 9pt; }
  .track { height: 7px; margin-top: 5px; border-radius: 99px; background: #eef0ff; overflow: hidden; }
  .track span { display: block; height: 100%; border-radius: inherit; background: #6366f1; }
  .panel { padding: 13px 15px; border: 1px solid #e6e8f0; border-radius: 10px; break-inside: avoid; }
  .career-card { margin: 11px 0; padding: 14px; border: 1px solid #e3e6ef; border-radius: 10px; break-inside: avoid; }
  .career-heading { display: flex; align-items: center; gap: 9px; }
  .career-heading h3 { flex: 1; }
  .rank { display: inline-flex; align-items: center; justify-content: center; width: 23px; height: 23px; border-radius: 50%; color: #4338ca; background: #eef0ff; font-weight: 700; }
  .match { padding: 4px 8px; border-radius: 20px; color: #166534; background: #dcfce7; font-size: 8pt; font-weight: 700; white-space: nowrap; }
  .career-card p { margin: 9px 0 0; color: #4b5563; }
  .course-list { margin-top: 10px; padding-top: 9px; border-top: 1px solid #eef0f4; font-size: 9pt; }
  .course-list ul { margin: 5px 0 0; padding-left: 18px; }
  .course-list li { margin: 5px 0; }
  .course-link { color: #4f46e5; overflow-wrap: anywhere; font-size: 8pt; }
  .muted { color: #64748b; }
  footer { margin-top: 28px; padding-top: 10px; border-top: 1px solid #e5e7eb; color: #64748b; font-size: 8pt; }
  .disclaimer { margin-top: 16px; padding: 11px 13px; color: #475569; background: #f8fafc; border-radius: 8px; font-size: 8.5pt; }
  @media screen { body { max-width: 780px; margin: 24px auto; padding: 24px; } }
</style>
</head>
<body>
  <div class="brand"><span class="brand-mark"></span>PathFinder</div>
  <header class="hero">
    <div class="eyebrow">Student career profile</div>
    <h1>Career Assessment Report</h1>
    <p>Your saved interest profile, aptitude scores and career recommendations.</p>
    <div class="meta">
      <div><small>Student</small><strong>${escapeHtml(name)}</strong></div>
      <div><small>Assessment date</small><strong>${escapeHtml(assessmentDate)}</strong></div>
      <div><small>Assessment ID</small><strong>${escapeHtml(assessmentId)}</strong></div>
      <div><small>Recommendation provider</small><strong>${escapeHtml(provider)}</strong></div>
    </div>
  </header>

  <h2>RIASEC Interest Profile</h2>
  <div class="panel">${scoreRows(riasecScores, RIASEC_LABELS)}</div>

  <h2>Aptitude Evaluation</h2>
  <div class="panel">${scoreRows(aptitudeScores, APTITUDE_LABELS)}
    <p class="muted" style="margin:10px 0 0;font-size:8pt">Aptitude scores are shown out of 2, as used by this assessment.</p>
  </div>

  <h2>Career Recommendations</h2>
  ${recommendationCards(assessment.recommendations)}

  <div class="disclaimer">
    <strong>About this report:</strong> This report summarizes the results saved by PathFinder for this assessment. Career matches are guidance for further exploration and should be considered alongside the student's interests, learning goals and real-world experience.
  </div>
  <footer>Generated from saved PathFinder assessment data · PathFinder</footer>
</body>
</html>`;
};

export const downloadCareerReportPdf = ({ assessment, student }) => {
  if (!assessment || typeof assessment !== 'object') {
    throw new Error('Assessment data is not available for this report.');
  }

  const printWindow = window.open('', '_blank');
  if (!printWindow) return false;

  const html = buildReportHtml({ assessment, student });
  const studentName = safeFilename(student?.name || 'Student');
  const date = new Date(assessment.completedAt || assessment.createdAt || Date.now())
    .toISOString()
    .slice(0, 10);

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.document.title = `PathFinder_Career_Report_${studentName}_${date}`;
  printWindow.onafterprint = () => printWindow.close();
  printWindow.focus();
  printWindow.setTimeout(() => printWindow.print(), 300);

  return true;
};
