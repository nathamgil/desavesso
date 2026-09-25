/* =====================================================================
   Dados de EXEMPLO do modo demonstração (site e painel).
   Só roda com o Supabase desligado. Todos os clientes são fictícios e
   marcados "(exemplo)". As "referências" usam fotos da pasta fotos/.
   Carrega depois de config.js e antes de agenda.js / admin.js.
   ===================================================================== */
(function () {
  'use strict';
  var CFG = window.TV;
  if (!CFG || !CFG.modoDemo) return;
  var VERSAO = 'dv_demo_semeado_v3';
  try { if (localStorage.getItem(VERSAO)) return; } catch (e) { return; }

  function iso(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  // dia a partir de hoje; segunda (fechado) vira terça
  function dia(off) {
    var d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() + off);
    if (d.getDay() === 1) d.setDate(d.getDate() + (off < 0 ? -1 : 1));
    return iso(d);
  }
  function criado(off, h) { var d = new Date(); d.setDate(d.getDate() + off); d.setHours(h || 10, 17, 0, 0); return d.toISOString(); }
  function fim(ini, min) { var p = ini.split(':'), m = (+p[0]) * 60 + (+p[1]) + min; return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); }
  var SERV = {}; CFG.servicosDemo.forEach(function (s) { SERV[s.id] = s; });
  var NOME = {}; CFG.artistas.forEach(function (a) { NOME[a.slug] = a.nome; });

  function obsTattoo(estilo, tec, local, tam, ideia, extra) {
    return ['Estilo: ' + estilo, 'Técnica: ' + tec, 'Local: ' + local, 'Tamanho: ' + tam]
      .concat(extra || [], ['Ideia: ' + ideia]).join('\n');
  }
  // [artista, serviço, dia, início, cliente, etapa, obs, anexos, valor, sinal, sinal pago, criado há n dias]
  var L = [
    ['leti', 'orcamento', dia(2), '15:00', 'Ana Clara', 'novo', obsTattoo('Arte autoral do artista', 'Handpoke (sem máquina)', 'Antebraço', '5 a 10 cm', 'Uma laranja com folha, traço solto, sem cor', ['Primeira tattoo: Sim']), ['fotos/leti-1.jpg'], 0, 0, false, 0],
    ['beco', 'sessao-pequena', dia(4), '14:00', 'Rafael M.', 'novo', obsTattoo('Flash (desenho pronto)', 'Com máquina', 'Perna / panturrilha', '10 a 20 cm', 'Quero o flash do cachorro bravo, do lado da tattoo que já tenho'), ['fotos/beco-4.jpg'], 0, 0, false, -1],
    ['leti', 'perfuracao', dia(3), '16:00', 'Júlia P.', 'novo', 'Perfuração: hélix na orelha esquerda', [], 0, 0, false, 0],
    ['olhos-felinos', 'orcamento', dia(5), '11:00', 'Beatriz S.', 'novo', obsTattoo('Botânica', 'Com máquina', 'Costela', '10 a 20 cm', 'Ramo de oliveira descendo pela costela, fininho'), ['fotos/caio-tatu-1.jpg', 'fotos/leti-4.jpg'], 0, 0, false, -1],
    ['caio-tatu', 'sessao-media', dia(6), '13:00', 'Thiago R.', 'conversa', obsTattoo('Colorida', 'Com máquina', 'Braço', '10 a 20 cm', 'Bracelete de búzios colorido no braço'), [], 0, 0, false, -3],
    ['olhos-felinos', 'sessao-longa', dia(9), '10:00', 'Marina L.', 'conversa', obsTattoo('Blackwork', 'Com máquina', 'Braço', 'Fechamento (braço, perna ou costas)', 'Tigre subindo o braço, bem preto'), ['fotos/olhos-felinos-4.jpg'], 0, 0, false, -4],
    ['beco', 'orcamento', dia(2), '11:30', 'Pedro H.', 'conversa', obsTattoo('Trago meu desenho', 'Handpoke (sem máquina)', 'Mão / dedos', 'Até 5 cm', 'Quatro letras nos dedos, desenho meu'), [], 0, 0, false, -2],
    ['leti', 'sessao-pequena', dia(7), '15:00', 'Luana F.', 'orcado', obsTattoo('Arte autoral do artista', 'Com máquina', 'Coxa', '10 a 20 cm', 'Uma peça autoral da Leti, qualquer uma dos disponíveis'), [], 45000, 10000, false, -5],
    ['caio-tatu', 'sessao-media', dia(8), '14:00', 'Igor N.', 'orcado', obsTattoo('Blackwork', 'Com máquina', 'Ombro', '10 a 20 cm', 'Abelhas e favo no ombro, com ondas'), ['fotos/caio-tatu-3.jpg'], 80000, 20000, false, -6],
    ['olhos-felinos', 'sessao-pequena', dia(10), '16:00', 'Carla D.', 'orcado', obsTattoo('Ornamental', 'Com máquina', 'Pescoço / nuca', '5 a 10 cm', 'Ornamento simétrico na nuca'), [], 38000, 10000, true, -5],
    ['beco', 'sessao-media', dia(0), '14:00', 'Diego A.', 'marcado', obsTattoo('Flash (desenho pronto)', 'Com máquina', 'Antebraço', '10 a 20 cm', 'Flash do muro de tijolos'), ['fotos/beco-2.jpg'], 70000, 20000, true, -8],
    ['olhos-felinos', 'sessao-pequena', dia(1), '11:00', 'Renata F.', 'marcado', obsTattoo('Fineline', 'Com máquina', 'Pé / tornozelo', 'Até 5 cm', 'Estrelinha no tornozelo'), [], 40000, 10000, true, -7],
    ['leti', 'perfuracao', dia(1), '17:00', 'Nina B.', 'marcado', 'Perfuração: septo', [], 12000, 0, false, -3],
    ['caio-tatu', 'sessao-longa', dia(3), '10:00', 'Mateus C.', 'marcado', obsTattoo('Colorida', 'Com máquina', 'Costas', 'Mais de 20 cm', 'Flores e búzios nas costas, colorido'), [], 150000, 40000, true, -10],
    ['beco', 'retoque', dia(5), '17:30', 'Gabi L.', 'marcado', obsTattoo('Flash (desenho pronto)', 'Com máquina', 'Braço', '5 a 10 cm', 'Retoque do flash feito em agosto'), [], 15000, 0, false, -4],
    ['leti', 'sessao-pequena', dia(-6), '15:00', 'Tainá O.', 'concluido', obsTattoo('Arte autoral do artista', 'Handpoke (sem máquina)', 'Ombro', '5 a 10 cm', 'Uma das artes disponíveis da Leti'), [], 50000, 10000, true, -15],
    ['beco', 'sessao-pequena', dia(-9), '13:00', 'André P.', 'concluido', obsTattoo('Flash (desenho pronto)', 'Com máquina', 'Perna / panturrilha', '10 a 20 cm', 'Personagem no muro'), [], 35000, 10000, true, -14],
    ['olhos-felinos', 'sessao-media', dia(-12), '10:00', 'Iara B.', 'concluido', obsTattoo('Botânica', 'Com máquina', 'Braço', '10 a 20 cm', 'Ave-do-paraíso no braço'), ['fotos/leti-4.jpg'], 90000, 20000, true, -20],
    ['leti', 'perfuracao', dia(-4), '16:30', 'Bia C.', 'concluido', 'Perfuração: umbigo', [], 11000, 0, false, -6],
    ['caio-tatu', 'orcamento', dia(-2), '15:00', 'Lucas M.', 'recusado', obsTattoo('Colorida', 'Com máquina', 'Peito', 'Mais de 20 cm', 'Cobrir uma tattoo antiga no peito', ['Cobertura: Sim']), [], 0, 0, false, -5],
    ['olhos-felinos', 'sessao-pequena', dia(-8), '11:00', 'Vinícius T.', 'recusado', obsTattoo('Fineline', 'Com máquina', 'Mão / dedos', 'Até 5 cm', 'Nome na lateral da mão'), [], 30000, 0, false, -11]
  ];
  var lista = L.map(function (x, i) {
    var s = SERV[x[1]];
    var status = x[5] === 'concluido' ? 'concluido' : x[5] === 'recusado' ? 'cancelado' : 'confirmado';
    return {
      codigo: 'EX' + String(1001 + i), barbeiro_id: x[0], barbeiro: NOME[x[0]],
      servico: s.nome, preco_centavos: 0, nome: x[4] + ' (exemplo)',
      telefone: '719000000' + String(10 + i), dia: x[2], inicio: x[3], fim: fim(x[3], s.duracao_min),
      obs: x[6], status: status, anexos: x[7], exemplo: true,
      etapa: x[5], valor_centavos: x[8], sinal_centavos: x[9], sinal_pago: x[10], criado_em: criado(x[11])
    };
  });
  var bloqueios = [
    { id: 'b1', barbeiro_id: 'caio-tatu', data: dia(12), hora_inicio: '00:00', hora_fim: '23:59', motivo: 'Viagem (exemplo)' },
    { id: 'b2', barbeiro_id: 'leti', data: dia(6), hora_inicio: '00:00', hora_fim: '23:59', motivo: 'Folga (exemplo)' }
  ];
  var flash = [
    { id: 'f1', nome: 'Coletivo Papel Torto (exemplo)', tipo: 'Expositor', contato: '(71) 9 0000-0101', observacao: 'Zines e prints em risografia', criado_em: criado(-9) },
    { id: 'f2', nome: 'Duda M. (exemplo)', tipo: 'Quer tatuar', contato: '(71) 9 0000-0102', observacao: 'Quer um flash pequeno de Halloween', criado_em: criado(-4) },
    { id: 'f3', nome: 'Ateliê Fio Solto (exemplo)', tipo: 'Expositor', contato: '(71) 9 0000-0103', observacao: 'Brincos e bordados', criado_em: criado(-3) },
    { id: 'f4', nome: 'Caio R. (exemplo)', tipo: 'Quer perfurar', contato: '(71) 9 0000-0104', observacao: 'Tragus', criado_em: criado(-1) }
  ];
  try {
    localStorage.setItem('dv_agendamentos_demo', JSON.stringify(lista));
    localStorage.setItem('dv_bloqueios_demo', JSON.stringify(bloqueios));
    localStorage.setItem('dv_flash_demo', JSON.stringify(flash));
    localStorage.removeItem('dv_artistas_demo');
    localStorage.setItem('dv_demo_semeado_v1', '1');   // o motor não semeia por cima
    localStorage.setItem(VERSAO, '1');
  } catch (e) {}
})();
