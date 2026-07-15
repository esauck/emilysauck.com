// Homepage guided booking form: track/option selection, deep-link preselect,
// and submission to /api/contact (Resend-backed serverless function).
//
// The on-screen confirmation must stay word-for-word in sync with the
// auto-reply email sent by api/contact.js — change both together.
(function () {
  var TRACKS = {
    cycle: { opts: ['A 1:1 session for me', 'A 1:1 session for my child', 'A session for my team', 'A speaker for my panel or organization'] },
    meno: { opts: ['A 1:1 session for myself', 'A group session for me and my friends', 'A speaker for my panel or organization'] }
  };
  var curTrack = null;

  function selectTrack(t) {
    curTrack = t;
    document.getElementById('tb-cycle').className = 'track-btn' + (t === 'cycle' ? ' sel-teal' : '');
    document.getElementById('tb-meno').className = 'track-btn' + (t === 'meno' ? ' sel-plum' : '');
    var wrap = document.getElementById('opts');
    wrap.innerHTML = '';
    TRACKS[t].opts.forEach(function (o) {
      var l = document.createElement('label');
      l.className = 'opt';
      var r = document.createElement('input');
      r.type = 'radio';
      r.name = 'fopt';
      r.value = o;
      var sp = document.createElement('span');
      sp.textContent = o;
      r.addEventListener('change', function () {
        document.querySelectorAll('.opt').forEach(function (x) { x.classList.remove('on'); });
        l.classList.add('on');
      });
      l.appendChild(r);
      l.appendChild(sp);
      wrap.appendChild(l);
    });
    document.getElementById('optblock').hidden = false;
  }

  document.getElementById('tb-cycle').addEventListener('click', function () { selectTrack('cycle'); });
  document.getElementById('tb-meno').addEventListener('click', function () { selectTrack('meno'); });

  // Deep links: "Book Cycle 101" → /#contact-cycle, "Book Peri/Menopause 101" → /#contact-meno.
  // Preselect the track and land on the form. Plain /#contact arrives unselected.
  function handleContactHash() {
    var h = location.hash;
    if (h === '#contact-cycle' || h === '#contact-meno') {
      selectTrack(h === '#contact-cycle' ? 'cycle' : 'meno');
      document.getElementById('contact').scrollIntoView();
    }
  }
  window.addEventListener('hashchange', handleContactHash);
  handleContactHash();

  document.getElementById('cform').addEventListener('submit', function (e) {
    e.preventDefault();
    var name = document.getElementById('f-name').value.trim();
    var email = document.getElementById('f-email').value.trim();
    var phone = document.getElementById('f-phone').value.trim();
    var note = document.getElementById('f-note').value.trim();
    var company = document.getElementById('f-company').value.trim();
    var opt = document.querySelector('input[name=fopt]:checked');
    var errs = [];
    if (!curTrack) errs.push('choose Cycle 101 or Peri/Menopause 101');
    if (curTrack && !opt) errs.push('pick what you’d like');
    if (!name) errs.push('add your name');
    if (!email || !/.+@.+\..+/.test(email)) errs.push('add a valid email');
    var ferr = document.getElementById('ferr');
    if (errs.length) {
      ferr.textContent = 'Almost there — please ' + errs.join(', ') + '.';
      ferr.style.display = 'block';
      return;
    }
    ferr.style.display = 'none';

    var payload = {
      track: curTrack,
      interest: opt.value,
      note: note,
      name: name,
      email: email,
      phone: phone,
      company: company // honeypot — humans leave it empty
    };

    var btn = document.getElementById('fsubmit');
    btn.disabled = true;
    btn.textContent = 'Sending…';

    fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      document.getElementById('cform').style.display = 'none';
      document.getElementById('fs-head').textContent = 'Thank you for reaching out, ' + name.split(' ')[0] + '!';
      document.getElementById('fsuccess').style.display = 'block';
    }).catch(function () {
      btn.disabled = false;
      btn.textContent = 'Send my request';
      ferr.textContent = 'Something went wrong sending your request — please try again in a moment, or email emilysauckconsulting@gmail.com directly.';
      ferr.style.display = 'block';
    });
  });
})();
