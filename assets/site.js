/* =====================================================================
   Peças da vitrine (capa e página do artista) — não depende do motor.
   - cards da equipe (levam para artista.html?a=<slug>)
   - Flash Day: some a data depois do evento e vira "próximas edições"
   - página do artista: foto, @, estilos, portfólio, pedir orçamento
   ===================================================================== */
(function () {
  'use strict';

  var CFG = window.TV;
  function $(s) { return document.querySelector(s); }
  function el(tag, cls, txt) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (txt != null) n.textContent = txt;
    return n;
  }

  var ano = $('#ano');
  if (ano) ano.textContent = new Date().getFullYear();
  if (CFG.modoDemo && $('#faixa-demo')) $('#faixa-demo').hidden = false;

  // "agora" pode ser simulado com ?hoje=2026-10-12 para conferir a troca do Flash Day
  function agora() {
    var sim = new URLSearchParams(location.search).get('hoje');
    return sim && /^\d{4}-\d{2}-\d{2}$/.test(sim) ? new Date(sim + 'T12:00:00-03:00') : new Date();
  }

  /* ---- cards da equipe ---- */
  function cardArtista(a) {
    var c = el('a', 'membro cor-' + (a.cor || 'roxo'));
    c.href = 'artista.html?a=' + encodeURIComponent(a.slug);
    var fig = el('div', 'membro-img');
    var im = el('img'); im.src = a.fotos[0].src; im.alt = a.fotos[0].alt;
    if (a.fotos[0].pos) im.style.objectPosition = a.fotos[0].pos;
    var av = el('img', 'av'); av.src = a.foto; av.alt = ''; av.loading = 'lazy';
    fig.appendChild(im); fig.appendChild(av);
    c.appendChild(fig);
    var info = el('div', 'membro-info');
    info.appendChild(el('h3', null, a.nome));
    info.appendChild(el('span', 'arroba', '@' + a.instagram));
    info.appendChild(el('p', null, a.linha));
    var ver = el('span', 'ver'); ver.appendChild(el('span', null, 'Ver página →'));
    info.appendChild(ver);
    c.appendChild(info);
    return c;
  }
  var equipe = $('#lista-equipe');
  if (equipe) {
    var pular = equipe.getAttribute('data-sem') || '';
    CFG.artistas.forEach(function (a) { if (a.slug !== pular) equipe.appendChild(cardArtista(a)); });
  }

  /* ---- botão flutuante some quando o pedido já está na tela ---- */
  var flutua = $('.flutua'), agendar = $('#agendar');
  if (flutua && agendar && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (e) { flutua.hidden = e[0].isIntersecting; }, { threshold: 0.05 }).observe(agendar);
  }

  /* ---- mapa ---- */
  var mapa = $('#mapa');
  if (mapa && CFG.endereco.embed) {
    var ifr = el('iframe');
    ifr.src = CFG.endereco.embed; ifr.loading = 'lazy'; ifr.title = 'Mapa: ' + CFG.endereco.busca;
    ifr.referrerPolicy = 'no-referrer-when-downgrade';
    mapa.appendChild(ifr);
  }

  /* ---- Flash Day: depois do dia, some a data ---- */
  var fd = CFG.flashDay;
  var passou = fd && agora() >= new Date(fd.ate);
  Array.prototype.forEach.call(document.querySelectorAll('[data-flash="antes"]'), function (n) { n.hidden = passou; });
  Array.prototype.forEach.call(document.querySelectorAll('[data-flash="depois"]'), function (n) { n.hidden = !passou; });
  var expor = $('#btn-expor');
  if (expor && fd) expor.href = fd.form;

  /* ---- página do artista ---- */
  var pagina = $('#artista-pagina');
  if (!pagina) return;
  var slug = new URLSearchParams(location.search).get('a') || (location.hash.match(/^#\/([\w-]+)/) || [])[1];
  var a = slug && CFG.artistaPor(slug);
  if (!a) {
    $('#art-nao-achei').hidden = false;
    return;
  }
  document.title = a.nome + ' · ' + CFG.nome;
  var capa = $('#art-capa');
  capa.className = 'art-capa cor-' + (a.cor || 'roxo');
  $('#art-av').src = a.foto;
  $('#art-av').alt = 'Foto de perfil de ' + a.nome;
  $('#art-nome').textContent = a.nome;
  var arroba = $('#art-arroba');
  arroba.textContent = '@' + a.instagram;
  arroba.href = 'https://www.instagram.com/' + a.instagram + '/';
  $('#art-linha').textContent = a.linha;
  if (a.frase) { $('#art-frase').textContent = '“' + a.frase + '”'; $('#art-frase').hidden = false; }
  if (a.bio) {
    var bio = $('#art-bio');
    a.bio.forEach(function (l) { bio.appendChild(el('li', null, l)); });
    $('#art-sobre').hidden = false;
  }
  var est = $('#art-estilos');
  a.estilos.forEach(function (e) { est.appendChild(el('span', null, e)); });

  var pedir = $('#art-pedir');
  pedir.textContent = 'Pedir orçamento com ' + a.nome;
  pedir.href = 'index.html?artista=' + encodeURIComponent(a.slug) + '#agendar';
  var fl = $('#art-flutua');
  if (fl) { fl.href = pedir.href; fl.lastChild.textContent = ' Orçamento com ' + a.nome; }

  var extras = $('#art-extras');
  if (a.whatsapp) {
    var z = el('a', 'btn btn-zap', 'WhatsApp ' + (a.whatsappVisivel || ''));
    z.href = 'https://wa.me/' + a.whatsapp; z.target = '_blank'; z.rel = 'noopener';
    extras.appendChild(z);
  }
  if (a.extra) {
    var x = el('a', 'btn btn-linha', a.extra.rotulo);
    x.href = a.extra.url; x.target = '_blank'; x.rel = 'noopener';
    extras.appendChild(x);
  }

  var port = $('#art-portfolio');
  $('#art-port-titulo').textContent = 'Trabalhos de ' + a.nome;
  a.fotos.forEach(function (f) {
    var fig = el('figure');
    var im = el('img'); im.src = f.src; im.alt = f.alt; im.loading = 'lazy';
    if (f.pos) im.style.objectPosition = f.pos;
    fig.appendChild(im);
    fig.appendChild(el('figcaption', null, f.alt));
    port.appendChild(fig);
  });
  var mais = $('#art-mais');
  mais.href = 'https://www.instagram.com/' + a.instagram + '/';
  mais.textContent = 'Ver mais no @' + a.instagram;

  if (a.perfuracao) $('#art-perf').hidden = false;
  $('#art-outros-titulo').textContent = 'Outros artistas do ' + CFG.nome;
  var outros = $('#lista-outros');
  CFG.artistas.forEach(function (o) { if (o.slug !== a.slug) outros.appendChild(cardArtista(o)); });

  // compartilhar a página (link direto do artista)
  var comp = $('#art-compartilhar'), saida = $('#art-compartilhado');
  comp.addEventListener('click', function () {
    var url = location.origin + location.pathname + '?a=' + a.slug;
    if (navigator.share) {
      navigator.share({ title: a.nome + ' · ' + CFG.nome, url: url }).catch(function () {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(function () { saida.textContent = 'Link copiado.'; },
        function () { saida.textContent = url; });
    } else { saida.textContent = url; }
  });
  pagina.hidden = false;
})();
