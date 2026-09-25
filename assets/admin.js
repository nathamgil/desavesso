/* =====================================================================
   Painel do Estúdio Desavesso
   Visão geral · funil de pedidos · agenda da semana por artista ·
   artistas (agenda aberta, especialidades) · relatório · Flash Day.
   Demo: lê e grava no localStorage (dv_*). Real: Supabase (schema.sql).
   ===================================================================== */
(function () {
  'use strict';

  var CFG  = window.TV;
  var DEMO = CFG.modoDemo;
  var sb   = null;

  var SEMANA = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];
  var SEM_C  = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
  var MESES  = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
  var ETAPAS = [
    { id: 'novo',      nome: 'Novo' },
    { id: 'conversa',  nome: 'Em conversa' },
    { id: 'orcado',    nome: 'Orçado' },
    { id: 'marcado',   nome: 'Sessão marcada' },
    { id: 'concluido', nome: 'Concluído' },
    { id: 'recusado',  nome: 'Recusado' }
  ];
  function nomeEtapa(id) { return (ETAPAS.filter(function (e) { return e.id === id; })[0] || {}).nome || id; }

  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function el(t, c, x) { var n = document.createElement(t); if (c) n.className = c; if (x != null) n.textContent = x; return n; }
  function iso(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function deIso(s) { var p = String(s).split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function hhmm(t) { return String(t || '').slice(0, 5); }
  function minutos(t) { var p = String(t).split(':'); return (+p[0]) * 60 + (+p[1]); }
  function deMin(m) { return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); }
  function reais(c) { return (c / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: c % 100 ? 2 : 0 }); }
  function porExtenso(s) { var d = deIso(s); return SEMANA[d.getDay()] + ', ' + d.getDate() + ' de ' + MESES[d.getMonth()]; }
  function curto(s) { var d = deIso(s); return SEM_C[d.getDay()] + ' ' + d.getDate() + '/' + String(d.getMonth() + 1).padStart(2, '0'); }
  function relativo(s) {
    var hoje = iso(new Date()), am = new Date(); am.setDate(am.getDate() + 1);
    return s === hoje ? 'Hoje' : s === iso(am) ? 'Amanhã' : curto(s);
  }
  function tel(t) { var d = String(t || '').replace(/\D/g, ''); return d.length === 11 ? '(' + d.slice(0, 2) + ') ' + d[2] + ' ' + d.slice(3, 7) + '-' + d.slice(7) : t; }
  function aviso(cx, cls, txt) { cx.innerHTML = ''; cx.appendChild(el('div', 'aviso ' + cls, txt)); }
  function primeiroNome(n) { return String(n || '').replace(/\s*\(exemplo\)/, '').split(' ')[0]; }

  var artistas = [];     // [{id, slug, nome, foto, instagram, user_id, agenda_aberta, especialidades}]
  var pedidos  = [];     // normalizados
  var bloqueios = [];
  var filtro = null;     // id do artista ou null
  var aba = 'geral';
  var etapaMobile = 'novo';
  var semanaIni = inicioSemana(new Date());
  var mesRef = new Date(); mesRef.setDate(1);

  function inicioSemana(d) { var x = new Date(d); x.setHours(12, 0, 0, 0); var k = (x.getDay() + 5) % 7; x.setDate(x.getDate() - k); return x; } // terça
  function artistaDe(id) { return artistas.filter(function (a) { return a.id === id; })[0] || {}; }
  function doFiltro(p) { return !filtro || p.barbeiro_id === filtro; }

  /* ================= fonte de dados ================= */

  function lsLe(k, pad) { try { return JSON.parse(localStorage.getItem(k) || pad); } catch (e) { return JSON.parse(pad); } }
  function lsGrava(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }
  function r(x) { if (x.error) throw x.error; return x.data; }

  function etapaPadrao(a) {
    if (a.etapa) return a.etapa;
    return a.status === 'cancelado' ? 'recusado' : a.status === 'concluido' ? 'concluido' : 'novo';
  }
  function normalizaDemo(a) {
    return { codigo: a.codigo, barbeiro_id: a.barbeiro_id, barbeiro: a.barbeiro, servico: a.servico,
      nome: a.nome, telefone: a.telefone, dia: a.dia, inicio: a.inicio, fim: a.fim, obs: a.obs || '',
      status: a.status, anexos: a.anexos || [], anexosFora: a.anexos_fora || 0,
      etapa: etapaPadrao(a), valor: a.valor_centavos || 0, sinal: a.sinal_centavos || 0,
      sinalPago: !!a.sinal_pago, criado: a.criado_em || (a.dia + 'T12:00:00') };
  }
  function normalizaReal(a) {
    return { codigo: a.codigo, barbeiro_id: a.barbeiro_id, barbeiro: a.barbeiro_nome, servico: a.servico_nome,
      nome: a.cliente_nome, telefone: a.cliente_telefone, dia: a.data, inicio: hhmm(a.inicio), fim: hhmm(a.fim),
      obs: a.observacao || '', status: a.status, anexos: a.anexos || [], anexosFora: 0,
      etapa: etapaPadrao(a), valor: a.valor_orcado_centavos || 0, sinal: a.sinal_centavos || 0,
      sinalPago: !!a.sinal_pago, criado: a.criado_em };
  }

  var DADOS = {
    artistas: function () {
      if (DEMO) {
        var over = lsLe('dv_artistas_demo', '{}');
        return Promise.resolve(CFG.artistas.map(function (a) {
          var o = over[a.slug] || {};
          return { id: a.slug, slug: a.slug, nome: a.nome, foto: a.foto, instagram: a.instagram, user_id: null,
            agenda_aberta: o.agenda_aberta !== false, especialidades: o.especialidades || a.estilos.slice() };
        }));
      }
      return sb.from('barbeiros').select('id,slug,nome,foto,instagram,user_id,agenda_aberta,especialidades')
        .eq('ativo', true).order('ordem').then(r);
    },
    pedidos: function () {
      if (DEMO) return Promise.resolve(lsLe('dv_agendamentos_demo', '[]').map(normalizaDemo));
      var desde = new Date(); desde.setDate(desde.getDate() - 120);
      return sb.from('agendamentos').select('*').gte('data', iso(desde)).order('data').order('inicio').limit(1000)
        .then(r).then(function (l) { return l.map(normalizaReal); });
    },
    salvarPedido: function (p, campos) {
      if (DEMO) {
        var l = lsLe('dv_agendamentos_demo', '[]');
        l.forEach(function (x) {
          if (x.codigo !== p.codigo) return;
          if ('etapa' in campos) x.etapa = campos.etapa;
          if ('valor' in campos) x.valor_centavos = campos.valor;
          if ('sinal' in campos) x.sinal_centavos = campos.sinal;
          if ('sinalPago' in campos) x.sinal_pago = campos.sinalPago;
          if ('dia' in campos) { x.dia = campos.dia; x.inicio = campos.inicio; x.fim = campos.fim; }
          if ('status' in campos) x.status = campos.status;
        });
        lsGrava('dv_agendamentos_demo', l);
        return Promise.resolve();
      }
      var u = {};
      if ('etapa' in campos) { u.etapa = campos.etapa; u.etapa_em = new Date().toISOString(); }
      if ('valor' in campos) u.valor_orcado_centavos = campos.valor;
      if ('sinal' in campos) u.sinal_centavos = campos.sinal;
      if ('sinalPago' in campos) u.sinal_pago = campos.sinalPago;
      if ('dia' in campos) {
        u.data = campos.dia; u.inicio = campos.inicio; u.fim = campos.fim;
        u.duracao_min = minutos(campos.fim) - minutos(campos.inicio);
      }
      if ('status' in campos) { u.status = campos.status; if (campos.status === 'cancelado') u.cancelado_em = new Date().toISOString(); }
      return sb.from('agendamentos').update(u).eq('codigo', p.codigo).then(r);
    },
    bloqueios: function () {
      var desde = new Date(); desde.setDate(desde.getDate() - 14);
      if (DEMO) return Promise.resolve(lsLe('dv_bloqueios_demo', '[]'));
      return sb.from('bloqueios').select('*').gte('data', iso(desde)).order('data').then(r);
    },
    criarBloqueios: function (lista) {
      if (DEMO) {
        var l = lsLe('dv_bloqueios_demo', '[]');
        lista.forEach(function (b) { b.id = String(Math.random()).slice(2, 10); l.push(b); });
        lsGrava('dv_bloqueios_demo', l);
        return Promise.resolve();
      }
      return sb.from('bloqueios').insert(lista).then(r);
    },
    apagarBloqueio: function (id) {
      if (DEMO) { lsGrava('dv_bloqueios_demo', lsLe('dv_bloqueios_demo', '[]').filter(function (b) { return b.id !== id; })); return Promise.resolve(); }
      return sb.from('bloqueios').delete().eq('id', id).then(r);
    },
    salvarArtista: function (a, campos) {
      if (DEMO) {
        var over = lsLe('dv_artistas_demo', '{}');
        over[a.slug] = Object.assign(over[a.slug] || {}, campos);
        lsGrava('dv_artistas_demo', over);
        return Promise.resolve();
      }
      return sb.from('barbeiros').update(campos).eq('id', a.id).then(r);
    },
    flash: function () {
      if (DEMO) return Promise.resolve(lsLe('dv_flash_demo', '[]'));
      return sb.from('flash_interessados').select('*').order('criado_em', { ascending: false }).then(r);
    },
    criarFlash: function (f) {
      if (DEMO) {
        var l = lsLe('dv_flash_demo', '[]');
        f.id = String(Math.random()).slice(2, 10); f.criado_em = new Date().toISOString();
        l.unshift(f); lsGrava('dv_flash_demo', l);
        return Promise.resolve();
      }
      return sb.from('flash_interessados').insert(f).then(r);
    }
  };

  /* ================= peças comuns ================= */

  // "Chave: valor" por linha na observação -> pares
  function projetoDe(p) {
    return p.obs.split('\n').map(function (l) {
      var i = l.indexOf(':');
      return i > 0 ? [l.slice(0, i).trim(), l.slice(i + 1).trim()] : ['Nota', l.trim()];
    }).filter(function (x) { return x[1]; });
  }
  function campo(p, chave) { var c = projetoDe(p).filter(function (x) { return x[0] === chave; })[0]; return c ? c[1] : ''; }
  function ehPerf(p) { return /perfura/i.test(p.servico); }
  function estiloDe(p) { return ehPerf(p) ? 'Perfuração' : (campo(p, 'Estilo') || 'Não informado'); }

  function avatar(a, cls) {
    var s = el('span', 'av ' + (cls || ''));
    if (a.foto) { var i = el('img'); i.src = a.foto; i.alt = ''; s.appendChild(i); }
    else s.textContent = (a.nome || '?')[0];
    return s;
  }
  function tagEtapa(id) { return el('span', 'et et-' + id, nomeEtapa(id)); }

  function cartaoPedido(p, compacto) {
    var b = el('button', 'ped et-borda-' + p.etapa);
    b.type = 'button';
    var cab = el('span', 'ped-cab');
    cab.appendChild(avatar(artistaDe(p.barbeiro_id), 'av-p'));
    var nm = el('span', 'ped-nome'); nm.appendChild(el('strong', null, p.nome.replace(' (exemplo)', '')));
    if (/\(exemplo\)/.test(p.nome)) nm.appendChild(el('small', 'ex', 'exemplo'));
    cab.appendChild(nm);
    b.appendChild(cab);
    b.appendChild(el('span', 'ped-linha', p.servico + (ehPerf(p) ? '' : ' · ' + estiloDe(p))));
    var rod = el('span', 'ped-rod');
    rod.appendChild(el('span', null, relativo(p.dia) + ' · ' + p.inicio));
    if (p.anexos.length) rod.appendChild(el('span', 'clip', p.anexos.length + (p.anexos.length === 1 ? ' referência' : ' referências')));
    if (p.valor) rod.appendChild(el('b', null, reais(p.valor)));
    b.appendChild(rod);
    if (compacto) b.appendChild(tagEtapa(p.etapa));
    b.addEventListener('click', function () { abreGaveta(p); });
    return b;
  }

  /* ================= filtro por artista ================= */

  function pintaFiltro() {
    var cx = $('#filtro'); cx.innerHTML = '';
    var todos = el('button', 'todos', 'Todos'); todos.type = 'button';
    todos.setAttribute('aria-pressed', filtro ? 'false' : 'true');
    todos.addEventListener('click', function () { filtro = null; pinta(); });
    cx.appendChild(todos);
    artistas.forEach(function (a) {
      var bt = el('button'); bt.type = 'button';
      bt.setAttribute('aria-pressed', filtro === a.id ? 'true' : 'false');
      bt.appendChild(avatar(a));
      bt.appendChild(document.createTextNode(a.nome));
      bt.addEventListener('click', function () { filtro = a.id; pinta(); });
      cx.appendChild(bt);
    });
    $('.filtro-linha').hidden = aba === 'artistas' || aba === 'flash';
  }

  /* ================= visão geral ================= */

  function pintaGeral() {
    var hoje = iso(new Date()), agora = new Date();
    var fimSem = new Date(); fimSem.setDate(fimSem.getDate() + 7);
    var ps = pedidos.filter(doFiltro);
    var novos = ps.filter(function (p) { return p.etapa === 'novo'; });
    var semana = ps.filter(function (p) { return p.etapa === 'marcado' && p.dia >= hoje && p.dia <= iso(fimSem); });
    var perf = ps.filter(function (p) { return ehPerf(p) && ['novo', 'conversa', 'orcado', 'marcado'].indexOf(p.etapa) >= 0; });
    var prox = ps.filter(function (p) {
      return p.status === 'confirmado' && p.etapa !== 'recusado' &&
        deIso(p.dia).getTime() + minutos(p.fim) * 60000 >= agora.getTime();
    }).sort(function (a, b) { return (a.dia + a.inicio) < (b.dia + b.inicio) ? -1 : 1; })[0];

    $('#geral-tit').textContent = porExtenso(hoje) + (filtro ? ' · ' + artistaDe(filtro).nome : '');
    var k = $('#kpis'); k.innerHTML = '';
    kpi(k, novos.length, 'Pedidos novos', 'esperando resposta', 'verde', function () { etapaMobile = 'novo'; vaiAba('pedidos'); });
    kpi(k, semana.length, 'Sessões confirmadas', 'nos próximos 7 dias', 'lilas', function () { vaiAba('agenda'); });
    kpi(k, perf.length, 'Perfuração', 'pedidos em aberto', 'laranja', null);
    var c = el('div', 'kpi kpi-prox');
    c.appendChild(el('span', 'kpi-rot', 'Próximo atendimento'));
    if (prox) {
      c.appendChild(el('b', 'kpi-prox-quando', relativo(prox.dia) + ' · ' + prox.inicio));
      c.appendChild(el('span', 'kpi-det', primeiroNome(prox.nome) + ' com ' + prox.barbeiro + ' · ' + prox.servico));
      c.classList.add('clicavel'); c.tabIndex = 0; c.setAttribute('role', 'button');
      c.addEventListener('click', function () { abreGaveta(prox); });
      c.addEventListener('keydown', function (e) { if (e.key === 'Enter') abreGaveta(prox); });
    } else c.appendChild(el('b', 'kpi-prox-quando', 'Nada marcado'));
    k.appendChild(c);

    var lh = $('#lista-hoje'); lh.innerHTML = '';
    var doDia = ps.filter(function (p) { return p.dia === hoje && p.etapa !== 'recusado' && p.status !== 'cancelado'; })
      .sort(function (a, b) { return minutos(a.inicio) - minutos(b.inicio); });
    if (!doDia.length) lh.appendChild(el('p', 'vazio-txt', deIso(hoje).getDay() === 1 ? 'Segunda: estúdio fechado.' : 'Nenhum atendimento hoje.'));
    doDia.forEach(function (p) {
      var li = el('button', 'linha-hoje'); li.type = 'button';
      li.appendChild(el('span', 'lh-hora', p.inicio + '\n' + p.fim));
      var t = el('span', 'lh-txt');
      t.appendChild(el('strong', null, primeiroNome(p.nome) + ' · ' + p.servico));
      t.appendChild(el('span', null, 'com ' + p.barbeiro));
      li.appendChild(t);
      li.appendChild(tagEtapa(p.etapa));
      li.addEventListener('click', function () { abreGaveta(p); });
      lh.appendChild(li);
    });

    var ln = $('#lista-novos'); ln.innerHTML = '';
    if (!novos.length) ln.appendChild(el('p', 'vazio-txt', 'Nenhum pedido novo. Tudo respondido.'));
    novos.sort(function (a, b) { return a.criado < b.criado ? 1 : -1; }).forEach(function (p) { ln.appendChild(cartaoPedido(p)); });

    var bolha = $('#bolha-novos');
    var totNovos = pedidos.filter(function (p) { return p.etapa === 'novo'; }).length;
    bolha.textContent = totNovos || ''; bolha.hidden = !totNovos;
  }
  function kpi(alvo, n, rot, det, cor, acao) {
    var c = el(acao ? 'button' : 'div', 'kpi kpi-' + cor);
    if (acao) { c.type = 'button'; c.addEventListener('click', acao); }
    c.appendChild(el('span', 'kpi-rot', rot));
    c.appendChild(el('b', 'kpi-num', String(n)));
    c.appendChild(el('span', 'kpi-det', det));
    alvo.appendChild(c);
  }

  /* ================= funil ================= */

  function pintaFunil() {
    var ps = pedidos.filter(doFiltro);
    var nav = $('#etapas-nav'), kb = $('#kanban');
    nav.innerHTML = ''; kb.innerHTML = '';
    ETAPAS.forEach(function (e) {
      var da = ps.filter(function (p) { return p.etapa === e.id; })
        .sort(function (a, b) { return (a.dia + a.inicio) < (b.dia + b.inicio) ? -1 : 1; });
      var t = el('button', 'etapa-tab'); t.type = 'button'; t.setAttribute('role', 'tab');
      t.setAttribute('aria-selected', etapaMobile === e.id ? 'true' : 'false');
      t.appendChild(document.createTextNode(e.nome + ' '));
      t.appendChild(el('span', 'n', String(da.length)));
      t.addEventListener('click', function () { etapaMobile = e.id; pintaFunil(); });
      nav.appendChild(t);

      var col = el('section', 'col et-col-' + e.id + (etapaMobile === e.id ? ' col-ativa' : ''));
      var cab = el('div', 'col-cab');
      cab.appendChild(el('h2', null, e.nome));
      cab.appendChild(el('span', 'n', String(da.length)));
      col.appendChild(cab);
      var lista = el('div', 'col-lista');
      if (!da.length) lista.appendChild(el('p', 'vazio-txt', 'Nada aqui.'));
      da.forEach(function (p) { lista.appendChild(cartaoPedido(p)); });
      col.appendChild(lista);
      kb.appendChild(col);
    });
  }

  /* ================= detalhe do pedido ================= */

  var gaveta = $('#gaveta');
  $('#gv-fechar').addEventListener('click', function () { gaveta.close(); });
  gaveta.addEventListener('click', function (e) { if (e.target === gaveta) gaveta.close(); });

  function msgZap(p, etapa) {
    var ola = 'Oi, ' + primeiroNome(p.nome) + '! Aqui é ' + (p.barbeiro || 'o estúdio') + ', do ' + CFG.nome + '. ';
    var quando = porExtenso(p.dia).toLowerCase() + ' às ' + p.inicio;
    if (etapa === 'orcado' && p.valor)
      return ola + 'O orçamento do seu pedido (' + p.servico + ') ficou em ' + reais(p.valor) +
        (p.sinal ? ', com sinal de ' + reais(p.sinal) + ' para garantir a data' : '') + '. Posso reservar ' + quando + '?';
    if (etapa === 'marcado')
      return ola + 'Sua sessão está marcada: ' + quando + ', na ' + CFG.endereco.linha1 + ', ' + CFG.endereco.linha2 + '. Qualquer coisa, me chama aqui.';
    if (etapa === 'concluido')
      return ola + 'Obrigado pela sessão! Como está a cicatrização? Qualquer dúvida, me chama.';
    var proj = ehPerf(p) ? '' : ' (' + [estiloDe(p), campo(p, 'Local'), campo(p, 'Tamanho')].filter(Boolean).join(', ') + ')';
    return ola + 'Recebi seu pedido de ' + p.servico.toLowerCase() + proj + ' pelo site. Vamos conversar sobre a ideia?';
  }

  function abreGaveta(p) {
    $('#gv-cod').textContent = 'Pedido ' + p.codigo + ' · feito ' + (p.criado ? relativo(iso(new Date(p.criado))).toLowerCase() : '');
    $('#gv-nome').textContent = p.nome;
    var c = $('#gv-corpo'); c.innerHTML = '';

    // etapas clicáveis
    var trilha = el('div', 'trilha');
    ETAPAS.forEach(function (e) {
      var b = el('button', 'trilha-p', e.nome); b.type = 'button';
      b.setAttribute('aria-pressed', p.etapa === e.id ? 'true' : 'false');
      b.addEventListener('click', function () {
        var campos = { etapa: e.id };
        if (e.id === 'recusado') campos.status = 'cancelado';
        else if (e.id === 'concluido') campos.status = 'concluido';
        else if (p.status !== 'confirmado') campos.status = 'confirmado';
        salva(p, campos);
      });
      trilha.appendChild(b);
    });
    c.appendChild(secao('Etapa', trilha));

    // cliente + WhatsApp
    var cli = el('div', 'gv-grade');
    par(cli, 'WhatsApp', tel(p.telefone));
    par(cli, 'Artista', p.barbeiro);
    par(cli, 'Sessão', p.servico);
    par(cli, 'Data pedida', porExtenso(p.dia) + ', ' + p.inicio + ' às ' + p.fim);
    var zap = el('a', 'btn btn-zap btn-bloco', 'Responder no WhatsApp');
    zap.href = 'https://wa.me/55' + String(p.telefone).replace(/\D/g, '').replace(/^55/, '') + '?text=' + encodeURIComponent(msgZap(p, p.etapa));
    zap.target = '_blank'; zap.rel = 'noopener';
    var prev = el('p', 'msg-pronta', msgZap(p, p.etapa));
    var sc = secao('Cliente', cli); sc.appendChild(el('p', 'rotulo-campo', 'Mensagem pronta')); sc.appendChild(prev); sc.appendChild(zap);
    c.appendChild(sc);

    // projeto
    var pj = el('div', 'gv-grade');
    projetoDe(p).forEach(function (x) { par(pj, x[0], x[1]); });
    if (!p.obs) pj.appendChild(el('p', 'vazio-txt', 'Sem detalhes.'));
    c.appendChild(secao(ehPerf(p) ? 'Perfuração' : 'Projeto', pj));

    // referências
    if (p.anexos.length) c.appendChild(secao('Referências (' + p.anexos.length + ')', miniaturas(p)));

    // orçamento
    var fo = el('form', 'gv-form');
    fo.innerHTML =
      '<div class="campos-2">' +
      '<div class="campo"><label for="gv-valor">Valor do orçamento (R$)</label><input id="gv-valor" inputmode="decimal" placeholder="Ex: 450"></div>' +
      '<div class="campo"><label for="gv-sinal">Sinal (R$)</label><input id="gv-sinal" inputmode="decimal" placeholder="Ex: 100"></div>' +
      '</div>' +
      '<label class="check"><input type="checkbox" id="gv-pago"> Sinal pago</label>' +
      '<div class="acoes"><button class="btn btn-prata" type="submit">Salvar orçamento</button></div>';
    $('#gv-valor', fo).value = p.valor ? String(p.valor / 100).replace('.', ',') : '';
    $('#gv-sinal', fo).value = p.sinal ? String(p.sinal / 100).replace('.', ',') : '';
    $('#gv-pago', fo).checked = p.sinalPago;
    fo.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var v = centavos($('#gv-valor', fo).value), s = centavos($('#gv-sinal', fo).value);
      if (v == null || s == null) return alert('Use só números no valor e no sinal. Ex: 450 ou 450,50');
      var campos = { valor: v, sinal: s, sinalPago: $('#gv-pago', fo).checked };
      if (v && (p.etapa === 'novo' || p.etapa === 'conversa')) campos.etapa = 'orcado';
      salva(p, campos);
    });
    c.appendChild(secao('Orçamento', fo));

    // marcar a sessão
    var fm = el('form', 'gv-form');
    fm.innerHTML =
      '<div class="campos-3">' +
      '<div class="campo"><label for="gv-dia">Dia</label><input id="gv-dia" type="date" required></div>' +
      '<div class="campo"><label for="gv-hora">Início</label><input id="gv-hora" type="time" step="1800" required></div>' +
      '<div class="campo"><label for="gv-dur">Duração</label><select id="gv-dur">' +
      [30, 60, 90, 120, 180, 240, 300, 360, 480].map(function (m) { return '<option value="' + m + '">' + (m < 60 ? m + ' min' : (m / 60) + 'h') + '</option>'; }).join('') +
      '</select></div></div>' +
      '<div id="gv-msg-sessao"></div>' +
      '<div class="acoes"><button class="btn btn-prata" type="submit">Marcar na agenda</button></div>';
    $('#gv-dia', fm).value = p.dia; $('#gv-hora', fm).value = p.inicio;
    var dur = minutos(p.fim) - minutos(p.inicio), sel = $('#gv-dur', fm);
    if (!$$('option', sel).some(function (o) { return +o.value === dur; })) sel.appendChild(new Option(dur + ' min', dur));
    sel.value = String(dur);
    fm.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var d = $('#gv-dia', fm).value, h = $('#gv-hora', fm).value, m = +sel.value;
      if (!d || !h) return;
      var f = deMin(minutos(h) + m);
      var choque = pedidos.filter(function (x) {
        return x.codigo !== p.codigo && x.barbeiro_id === p.barbeiro_id && x.dia === d && x.status === 'confirmado' &&
          minutos(h) < minutos(x.fim) && minutos(f) > minutos(x.inicio);
      })[0];
      if (choque) return aviso($('#gv-msg-sessao', fm), 'aviso-erro', 'Choca com ' + primeiroNome(choque.nome) + ' (' + choque.inicio + ' às ' + choque.fim + '). Escolha outro horário.');
      salva(p, { dia: d, inicio: h, fim: f, etapa: 'marcado', status: 'confirmado' });
    });
    c.appendChild(secao('Marcar a sessão', fm));

    if (!gaveta.open) gaveta.showModal();
  }
  function centavos(t) {
    t = String(t || '').trim().replace(/[R$\s.]/g, '').replace(',', '.');
    if (!t) return 0;
    var n = Number(t); return isFinite(n) && n >= 0 ? Math.round(n * 100) : null;
  }
  function secao(tit, corpo) { var s = el('section', 'gv-sec'); s.appendChild(el('h3', null, tit)); s.appendChild(corpo); return s; }
  function par(alvo, k, v) { var d = el('div', 'gv-par'); d.appendChild(el('span', null, k)); d.appendChild(el('b', null, v)); alvo.appendChild(d); }

  function salva(p, campos) {
    DADOS.salvarPedido(p, campos).then(function () {
      Object.keys(campos).forEach(function (k) { p[k === 'sinalPago' ? 'sinalPago' : k] = campos[k]; });
      carregaPedidos().then(function () {
        var novo = pedidos.filter(function (x) { return x.codigo === p.codigo; })[0];
        if (novo && gaveta.open) abreGaveta(novo);
        toast('Salvo.');
      });
    }).catch(function (e) { alert('Não consegui salvar: ' + (e.message || e)); });
  }

  // imagens de referência: demo usa o caminho/dataURL; real pede link assinado de 1h
  function miniaturas(p) {
    var box = el('div', 'anexo-admin'), ul = el('ul', 'anexo-lista');
    box.appendChild(ul);
    function poe(srcs) {
      srcs.forEach(function (src, i) {
        if (!src) return;
        var li = el('li'), b = el('button'), im = el('img');
        b.type = 'button'; b.setAttribute('aria-label', 'Ampliar referência ' + (i + 1));
        im.src = src; im.alt = ''; im.loading = 'lazy';
        b.appendChild(im); li.appendChild(b); ul.appendChild(li);
        b.addEventListener('click', function () { abreLupa(src, 'Referência ' + (i + 1) + ' · ' + p.nome); });
      });
    }
    if (DEMO) poe(p.anexos);
    else sb.storage.from('referencias').createSignedUrls(p.anexos, 3600).then(function (x) {
      if (x.error) throw x.error;
      poe(x.data.map(function (y) { return y.signedUrl; }));
    }).catch(function () { box.appendChild(el('span', null, 'Não consegui abrir as imagens.')); });
    if (p.anexosFora) box.appendChild(el('span', null, p.anexosFora + ' imagem(ns) não couberam neste aparelho (demo).'));
    return box;
  }
  function abreLupa(src, titulo) {
    $('#lupa-img').src = src; $('#lupa-img').alt = titulo; $('#lupa-titulo').textContent = titulo;
    $('#lupa').showModal();
  }
  $('#lupa').addEventListener('click', function () { this.close(); });

  var toastT;
  function toast(t) {
    var n = $('.toast') || document.body.appendChild(el('div', 'toast'));
    n.textContent = t; n.classList.add('vis');
    n.setAttribute('role', 'status');
    clearTimeout(toastT); toastT = setTimeout(function () { n.classList.remove('vis'); }, 1800);
  }

  /* ================= agenda da semana ================= */

  function pintaAgenda() {
    var cols = artistas.filter(function (a) { return !filtro || a.id === filtro; });
    var ini = new Date(semanaIni), fim = new Date(semanaIni); fim.setDate(fim.getDate() + 6);
    $('#sem-titulo').textContent = ini.getDate() + ' ' + MESES[ini.getMonth()].slice(0, 3) + ' – ' + fim.getDate() + ' ' + MESES[fim.getMonth()].slice(0, 3);
    var box = $('#semana'); box.innerHTML = '';
    box.style.setProperty('--ncol', cols.length);

    var cab = el('div', 'sem-linha sem-cab');
    cab.appendChild(el('span', 'sem-dia-rot', ''));
    cols.forEach(function (a) {
      var h = el('span', 'sem-art');
      h.appendChild(avatar(a)); h.appendChild(el('b', null, a.nome));
      if (!a.agenda_aberta) h.appendChild(el('small', null, 'agenda fechada'));
      cab.appendChild(h);
    });
    box.appendChild(cab);

    var hoje = iso(new Date());
    for (var i = 0; i < 7; i++) {
      var d = new Date(semanaIni); d.setDate(d.getDate() + i);
      var di = iso(d), exp = CFG.expediente[d.getDay()];
      var lin = el('div', 'sem-linha' + (di === hoje ? ' sem-hoje' : '') + (!exp || !exp.aberto ? ' sem-fechado' : ''));
      var rot = el('div', 'sem-dia-rot');
      rot.appendChild(el('b', null, SEM_C[d.getDay()]));
      rot.appendChild(el('span', null, d.getDate() + '/' + String(d.getMonth() + 1).padStart(2, '0')));
      if (di === hoje) rot.appendChild(el('small', null, 'hoje'));
      lin.appendChild(rot);
      if (!exp || !exp.aberto) {
        lin.appendChild(el('div', 'sem-fechado-txt', 'Estúdio fechado'));
        box.appendChild(lin); continue;
      }
      var livres = [];
      cols.forEach(function (a) {
        var cel = el('div', 'sem-cel');
        cel.appendChild(el('span', 'sem-cel-art', a.nome));
        bloqueios.filter(function (b) { return b.data === di && (!b.barbeiro_id || b.barbeiro_id === a.id); }).forEach(function (b) {
          cel.appendChild(el('div', 'sem-bloq', (b.hora_inicio === '00:00' && hhmm(b.hora_fim) === '23:59' ? 'Dia todo' : hhmm(b.hora_inicio) + '–' + hhmm(b.hora_fim)) + ' · ' + (b.motivo || 'Bloqueado')));
        });
        pedidos.filter(function (p) { return p.barbeiro_id === a.id && p.dia === di && p.status !== 'cancelado' && p.etapa !== 'recusado'; })
          .sort(function (x, y) { return minutos(x.inicio) - minutos(y.inicio); })
          .forEach(function (p) {
            var b = el('button', 'sem-item et-borda-' + p.etapa); b.type = 'button';
            b.appendChild(el('b', null, p.inicio + '–' + p.fim));
            b.appendChild(el('span', null, primeiroNome(p.nome) + ' · ' + p.servico));
            b.appendChild(tagEtapa(p.etapa));
            b.addEventListener('click', function () { abreGaveta(p); });
            cel.appendChild(b);
          });
        if (cel.children.length === 1) { cel.appendChild(el('span', 'sem-livre', 'livre')); cel.classList.add('sem-cel-vazia'); livres.push(a.nome); }
        lin.appendChild(cel);
      });
      // no celular, quem está livre vira uma linha só
      if (livres.length) lin.appendChild(el('div', 'sem-livres', (livres.length === cols.length ? 'Todos livres: ' : 'Livres: ') + livres.join(', ')));
      box.appendChild(lin);
    }
    pintaBloqueios();
  }
  $('#sem-menos').addEventListener('click', function () { semanaIni.setDate(semanaIni.getDate() - 7); pintaAgenda(); });
  $('#sem-mais').addEventListener('click', function () { semanaIni.setDate(semanaIni.getDate() + 7); pintaAgenda(); });
  $('#sem-hoje').addEventListener('click', function () { semanaIni = inicioSemana(new Date()); pintaAgenda(); });

  function pintaBloqueios() {
    var cx = $('#lista-bloqueios'); cx.innerHTML = '';
    var hoje = iso(new Date());
    var l = bloqueios.filter(function (b) { return b.data >= hoje && (!filtro || !b.barbeiro_id || b.barbeiro_id === filtro); })
      .sort(function (a, b) { return a.data < b.data ? -1 : 1; });
    if (!l.length) cx.appendChild(el('p', 'vazio-txt', 'Nenhuma folga marcada.'));
    l.forEach(function (b) {
      var li = el('div', 'bloq-linha');
      var t = el('div');
      t.appendChild(el('strong', null, porExtenso(b.data)));
      t.appendChild(el('span', null, (b.barbeiro_id ? artistaDe(b.barbeiro_id).nome : 'Estúdio todo') + ' · ' + (b.motivo || 'Bloqueado')));
      li.appendChild(t);
      var x = el('button', 'btn btn-linha mini', 'Liberar'); x.type = 'button';
      x.addEventListener('click', function () {
        if (!confirm('Liberar ' + porExtenso(b.data) + '?')) return;
        DADOS.apagarBloqueio(b.id).then(carregaBloqueios).then(pintaAgenda);
      });
      li.appendChild(x);
      cx.appendChild(li);
    });
  }

  $('#form-bloqueio').addEventListener('submit', function (ev) {
    ev.preventDefault();
    var cx = $('#msg-bloqueio'), de = $('#bl-data').value, ate = $('#bl-ate-dia').value || de;
    if (!de) return aviso(cx, 'aviso-erro', 'Escolha o dia.');
    if (ate < de) return aviso(cx, 'aviso-erro', 'O "até" tem que ser depois do "de".');
    var motivo = $('#bl-motivo-tipo').value + ($('#bl-motivo').value.trim() ? ': ' + $('#bl-motivo').value.trim() : '');
    var lista = [], d = deIso(de);
    while (iso(d) <= ate && lista.length < 60) {
      lista.push({ barbeiro_id: $('#bl-quem').value || null, data: iso(d), hora_inicio: '00:00', hora_fim: '23:59', motivo: motivo });
      d.setDate(d.getDate() + 1);
    }
    DADOS.criarBloqueios(lista).then(function () {
      aviso(cx, 'aviso-ok', lista.length === 1 ? 'Dia bloqueado. Não aparece mais para o cliente.' : lista.length + ' dias bloqueados.');
      $('#bl-data').value = ''; $('#bl-ate-dia').value = ''; $('#bl-motivo').value = '';
      return carregaBloqueios();
    }).then(pintaAgenda).catch(function (e) { aviso(cx, 'aviso-erro', e.message || 'Não consegui salvar.'); });
  });

  /* ================= artistas ================= */

  function pintaArtistas() {
    var box = $('#artistas-adm'); box.innerHTML = '';
    // aberto do computador (file://): mostra o endereço público da demo
    var base = location.protocol === 'file:' ? 'https://nathamgil.github.io/desavesso/' : location.href.replace(/admin\.html.*$/, '');
    artistas.forEach(function (a) {
      var c = el('article', 'art-adm');
      var cab = el('div', 'art-adm-cab');
      cab.appendChild(avatar(a, 'av-g'));
      var n = el('div'); n.appendChild(el('h2', null, a.nome)); n.appendChild(el('span', 'arroba', '@' + a.instagram));
      cab.appendChild(n);
      c.appendChild(cab);

      var sw = el('button', 'chave'); sw.type = 'button'; sw.setAttribute('role', 'switch');
      sw.setAttribute('aria-checked', a.agenda_aberta ? 'true' : 'false');
      sw.appendChild(el('span', 'chave-trilho'));
      sw.appendChild(el('span', 'chave-txt', a.agenda_aberta ? 'Agenda aberta' : 'Agenda fechada'));
      sw.addEventListener('click', function () {
        var v = !a.agenda_aberta;
        DADOS.salvarArtista(a, { agenda_aberta: v }).then(function () { a.agenda_aberta = v; pintaArtistas(); toast(v ? 'Agenda de ' + a.nome + ' aberta.' : 'Agenda de ' + a.nome + ' fechada.'); });
      });
      c.appendChild(sw);

      var f = el('form', 'art-adm-form');
      var idc = 'esp-' + a.slug;
      f.innerHTML = '<div class="campo"><label for="' + idc + '">Especialidades <small>(separe por vírgula)</small></label><textarea id="' + idc + '" rows="2"></textarea></div>' +
        '<div class="acoes" style="margin-top:.6rem"><button class="btn btn-linha mini" type="submit">Salvar especialidades</button></div>';
      $('textarea', f).value = (a.especialidades || []).join(', ');
      f.addEventListener('submit', function (ev) {
        ev.preventDefault();
        var l = $('textarea', f).value.split(',').map(function (x) { return x.trim(); }).filter(Boolean);
        DADOS.salvarArtista(a, { especialidades: l }).then(function () { a.especialidades = l; toast('Especialidades salvas.'); });
      });
      c.appendChild(f);

      var url = base + 'artista.html?a=' + a.slug;
      var lk = el('div', 'link-pub');
      lk.appendChild(el('span', 'rotulo-campo', 'Link público'));
      var a1 = el('a', null, url.replace(/^https?:\/\//, '')); a1.href = url; a1.target = '_blank'; a1.rel = 'noopener';
      lk.appendChild(a1);
      var cp = el('button', 'btn btn-linha mini', 'Copiar link'); cp.type = 'button';
      cp.addEventListener('click', function () {
        (navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject()).then(function () { toast('Link copiado.'); }, function () { prompt('Copie o link:', url); });
      });
      lk.appendChild(cp);
      c.appendChild(lk);

      var ps = pedidos.filter(function (p) { return p.barbeiro_id === a.id; });
      var m = el('p', 'art-adm-num');
      m.textContent = (function (n) { return n + (n === 1 ? ' novo' : ' novos'); })(ps.filter(function (p) { return p.etapa === 'novo'; }).length) + ' · ' +
        (function (n) { return n + (n === 1 ? ' sessão marcada' : ' sessões marcadas'); })(ps.filter(function (p) { return p.etapa === 'marcado'; }).length);
      c.appendChild(m);
      box.appendChild(c);
    });
  }

  /* ================= relatório ================= */

  function pintaRelatorio() {
    var ano = mesRef.getFullYear(), mes = mesRef.getMonth();
    $('#mes-titulo').textContent = MESES[mes] + ' ' + ano;
    var ps = pedidos.filter(doFiltro).filter(function (p) {
      var d = new Date(p.criado); return d.getFullYear() === ano && d.getMonth() === mes;
    });
    var viraram = ps.filter(function (p) { return p.etapa === 'marcado' || p.etapa === 'concluido'; });
    var orcado = ps.reduce(function (s, p) { return s + (p.valor || 0); }, 0);
    var sinais = ps.reduce(function (s, p) { return s + (p.sinalPago ? p.sinal : 0); }, 0);
    var k = $('#rel-kpis'); k.innerHTML = '';
    kpi(k, ps.length, 'Pedidos no mês', 'feitos pelo site', 'verde', null);
    kpi(k, viraram.length, 'Viraram sessão', 'marcadas ou concluídas', 'lilas', null);
    kpi(k, ps.length ? Math.round(viraram.length / ps.length * 100) + '%' : '—', 'Conversão', 'de pedido para sessão', 'laranja', null);
    kpi(k, reais(orcado), 'Valor orçado', sinais ? reais(sinais) + ' em sinais pagos' : 'soma dos orçamentos', 'branco', null);

    barras($('#rel-artista'), artistas.filter(function (a) { return !filtro || a.id === filtro; }).map(function (a) {
      return [a.nome, ps.filter(function (p) { return p.barbeiro_id === a.id; }).length];
    }));
    var est = {};
    ps.forEach(function (p) { var e = estiloDe(p); est[e] = (est[e] || 0) + 1; });
    barras($('#rel-estilo'), Object.keys(est).map(function (e) { return [e, est[e]]; }).sort(function (a, b) { return b[1] - a[1]; }));
    barras($('#rel-funil'), ETAPAS.map(function (e) { return [e.nome, ps.filter(function (p) { return p.etapa === e.id; }).length]; }));
  }
  // barras horizontais, uma série só (sem legenda): valor escrito em tinta, barra no roxo
  function barras(alvo, dados) {
    alvo.innerHTML = '';
    if (!dados.length || !dados.some(function (d) { return d[1]; })) { alvo.appendChild(el('p', 'vazio-txt', 'Sem pedidos neste mês.')); return; }
    var max = Math.max.apply(null, dados.map(function (d) { return d[1]; })) || 1;
    var ul = el('ul', 'barras');
    dados.forEach(function (d) {
      var li = el('li'); li.title = d[0] + ': ' + d[1] + (d[1] === 1 ? ' pedido' : ' pedidos');
      li.appendChild(el('span', 'barra-rot', d[0]));
      var t = el('span', 'barra-trilho'); var f = el('span', 'barra-fill'); f.style.width = (d[1] / max * 100) + '%';
      t.appendChild(f); li.appendChild(t);
      li.appendChild(el('b', 'barra-val', String(d[1])));
      ul.appendChild(li);
    });
    alvo.appendChild(ul);
  }
  $('#mes-menos').addEventListener('click', function () { mesRef.setMonth(mesRef.getMonth() - 1); pintaRelatorio(); });
  $('#mes-mais').addEventListener('click', function () { mesRef.setMonth(mesRef.getMonth() + 1); pintaRelatorio(); });

  /* ================= Flash Day ================= */

  function pintaFlash() {
    var fd = CFG.flashDay, dataEv = deIso(fd.data);
    var dias = Math.ceil((dataEv.getTime() - new Date().setHours(0, 0, 0, 0)) / 86400000);
    $('#flash-sub').textContent = porExtenso(fd.data) + ', a partir das ' + fd.hora + ' · ' +
      (dias > 0 ? 'faltam ' + dias + ' dias' : dias === 0 ? 'é hoje' : 'já aconteceu (o site já mostra "próximas edições no Instagram")');
    $('#flash-form').href = fd.form;
    DADOS.flash().then(function (l) {
      var k = $('#flash-kpis'); k.innerHTML = '';
      kpi(k, l.length, 'Interessados', 'anotados no painel', 'verde', null);
      kpi(k, l.filter(function (f) { return f.tipo === 'Expositor'; }).length, 'Expositores', 'feira de arte', 'lilas', null);
      kpi(k, l.filter(function (f) { return /tatuar|perfurar/.test(f.tipo); }).length, 'Público', 'quer tatuar ou perfurar', 'laranja', null);
      var cx = $('#lista-flash'); cx.innerHTML = '';
      if (!l.length) cx.appendChild(el('p', 'vazio-txt', 'Ninguém anotado ainda.'));
      l.forEach(function (f) {
        var li = el('div', 'bloq-linha');
        var t = el('div');
        t.appendChild(el('strong', null, f.nome));
        t.appendChild(el('span', null, [f.contato, f.observacao].filter(Boolean).join(' · ')));
        li.appendChild(t);
        li.appendChild(el('span', 'et et-' + (f.tipo === 'Expositor' ? 'conversa' : 'marcado'), f.tipo));
        cx.appendChild(li);
      });
    });
  }
  $('#form-flash').addEventListener('submit', function (ev) {
    ev.preventDefault();
    var nome = $('#fl-nome').value.trim();
    if (nome.length < 2) return aviso($('#msg-flash'), 'aviso-erro', 'Escreva o nome.');
    DADOS.criarFlash({ nome: nome, tipo: $('#fl-tipo').value, contato: $('#fl-contato').value.trim() || null, observacao: $('#fl-obs').value.trim() || null })
      .then(function () { $('#form-flash').reset(); aviso($('#msg-flash'), 'aviso-ok', 'Anotado.'); pintaFlash(); })
      .catch(function (e) { aviso($('#msg-flash'), 'aviso-erro', e.message || 'Não consegui salvar.'); });
  });

  /* ================= abas e partida ================= */

  function vaiAba(id) {
    aba = id;
    $$('.adm-aba').forEach(function (b) { b.setAttribute('aria-selected', b.getAttribute('data-aba') === id ? 'true' : 'false'); });
    $$('.adm-painel').forEach(function (p) { if (p.getAttribute('data-painel') === id) p.setAttribute('data-ativa', ''); else p.removeAttribute('data-ativa'); });
    try { history.replaceState(null, '', '#' + id); } catch (e) {}
    pinta();
    window.scrollTo(0, 0);
  }
  $$('.adm-aba').forEach(function (b) { b.addEventListener('click', function () { vaiAba(b.getAttribute('data-aba')); }); });
  $$('[data-ir]').forEach(function (b) { b.addEventListener('click', function () { vaiAba(b.getAttribute('data-ir')); }); });

  function pinta() {
    pintaFiltro();
    if (aba === 'geral') pintaGeral();
    if (aba === 'pedidos') pintaFunil();
    if (aba === 'agenda') pintaAgenda();
    if (aba === 'artistas') pintaArtistas();
    if (aba === 'relatorio') pintaRelatorio();
    if (aba === 'flash') pintaFlash();
    var bolha = $('#bolha-novos'), n = pedidos.filter(function (p) { return p.etapa === 'novo'; }).length;
    bolha.textContent = n || ''; bolha.hidden = !n;
  }
  function carregaPedidos() { return DADOS.pedidos().then(function (l) { pedidos = l; pinta(); }); }
  function carregaBloqueios() { return DADOS.bloqueios().then(function (l) { bloqueios = l; }); }

  function abrePainel(userId) {
    DADOS.artistas().then(function (lista) {
      artistas = lista;
      var eu = lista.filter(function (a) { return userId && a.user_id === userId; })[0];
      filtro = eu ? eu.id : null;
      if (eu) $('#quem-logado').textContent = 'Olá, ' + eu.nome;
      var sel = $('#bl-quem'); sel.innerHTML = '';
      lista.forEach(function (a) { var o = new Option(a.nome, a.id); if (eu && eu.id === a.id) o.selected = true; sel.appendChild(o); });
      sel.appendChild(new Option('O estúdio todo', ''));
      $('#tela-login').hidden = true;
      $('#tela-painel').hidden = false;
      var h = location.hash.slice(1);
      if ($('[data-painel="' + h + '"]')) aba = h;
      return carregaBloqueios().then(function () { return carregaPedidos(); }).then(function () { vaiAba(aba); });
    }).catch(function (e) { alert('Não consegui carregar o painel: ' + (e.message || e)); });
  }
  window.TV.painel = { abreGaveta: function (codigo) { var p = pedidos.filter(function (x) { return x.codigo === codigo; })[0]; if (p) abreGaveta(p); }, vaiAba: vaiAba };

  if (DEMO) {
    $('#faixa-demo').hidden = false;
    $('#btn-sair').hidden = true;
    abrePainel(null);
    return;
  }

  sb = window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseKey);
  $('#form-login').addEventListener('submit', function (ev) {
    ev.preventDefault();
    var cx = $('#msg-login');
    aviso(cx, 'aviso-neutro', 'Entrando…');
    sb.auth.signInWithPassword({ email: $('#lg-email').value.trim(), password: $('#lg-senha').value })
      .then(function (x) {
        if (x.error) return aviso(cx, 'aviso-erro', 'E-mail ou senha não conferem.');
        cx.innerHTML = '';
        abrePainel(x.data.user.id);
      });
  });
  $('#btn-sair').addEventListener('click', function () { sb.auth.signOut().then(function () { location.reload(); }); });
  sb.auth.getSession().then(function (x) {
    if (x.data && x.data.session) abrePainel(x.data.session.user.id);
    else $('#tela-login').hidden = false;
  });
})();
