/* =====================================================================
   Estúdio Desavesso — configuração
   Único arquivo que precisa ser editado para o site sair do modo de
   demonstração e entrar no ar de verdade.
   ===================================================================== */

window.TV = {

  /* ---- Estúdio ------------------------------------------------------ */
  nome:      'Estúdio Desavesso',
  slogan:    'Estúdio coletivo de tatuagem · Rio Vermelho, Salvador',
  instagram: 'estudiodesavesso',

  // O estúdio não tem WhatsApp próprio (A CONFIRMAR). Cada artista tem o
  // seu campo "whatsapp" abaixo: com número, o resumo vai para o WhatsApp
  // dele; sem número, abre o Direct do Instagram dele com o resumo copiado.
  whatsapp:        '',
  whatsappVisivel: '',

  endereco: {
    linha1: 'Rua Tupinambás, 423',
    linha2: 'Rio Vermelho, Salvador — BA',
    maps:   'https://www.google.com/maps/search/?api=1&query=Rua+Tupinamb%C3%A1s%2C+423%2C+Rio+Vermelho%2C+Salvador+BA',
    embed:  'https://www.google.com/maps?q=Rua+Tupinamb%C3%A1s%2C+423%2C+Rio+Vermelho%2C+Salvador+-+BA&output=embed',
    busca:  'Rua Tupinambás, 423, Rio Vermelho, Salvador - BA'
  },
  funcionamento: 'Terça a domingo',   // horário exato A CONFIRMAR

  /* ---- Flash Day ----------------------------------------------------
     Depois de "ate", a seção troca a data por "próximas edições no Instagram".
     Os preços valem SÓ no evento; fora dele tudo é sob orçamento.
  ------------------------------------------------------------------ */
  flashDay: {
    data:  '2026-10-10',
    hora:  '14h',
    ate:   '2026-10-11T00:00:00-03:00',
    form:  'https://docs.google.com/forms/d/e/1FAIpQLScNNO6LAsaGQyekV73uEQEXeJbXZs8h4qIdvmv-kF3LrvH19g/viewform'
  },

  /* ---- Supabase ---------------------------------------------------
     Enquanto estes dois campos estiverem vazios, o site roda em MODO
     DEMONSTRAÇÃO: o pedido funciona de verdade na tela, mas fica guardado
     só no navegador de quem está olhando.

     Para ligar de verdade:
       1. supabase.com  ->  New project (região: South America / São Paulo)
       2. SQL Editor    ->  cole e rode db/schema.sql inteiro
       3. Settings > API -> copie "Project URL" e a chave "anon public"
       4. cole abaixo e suba pro GitHub

     A chave anon é pública por natureza — ela aparece no código do site.
     Quem protege os dados é o RLS + as funções do schema.sql, não ela.
  ------------------------------------------------------------------ */
  supabaseUrl: '',
  supabaseKey: '',

  /* ---- Regras da agenda (espelham o db/schema.sql) ---------------- */
  regras: {
    passoMin:        30,
    antecedenciaMin: 30,
    janelaDias:      30,
    cancelamentoH:   2
  },

  /* ---- Expediente (0 = domingo) ------------------------------------
     Terça a domingo vem do Instagram. O HORÁRIO (10h às 19h) é
     PROVISÓRIO, A CONFIRMAR: serve só para a agenda da demo funcionar.
     O site mostra só "terça a domingo", sem hora.
  ------------------------------------------------------------------ */
  expediente: {
    0: { aberto: true, abre: '10:00', fecha: '19:00' },
    1: { aberto: false },
    2: { aberto: true, abre: '10:00', fecha: '19:00' },
    3: { aberto: true, abre: '10:00', fecha: '19:00' },
    4: { aberto: true, abre: '10:00', fecha: '19:00' },
    5: { aberto: true, abre: '10:00', fecha: '19:00' },
    6: { aberto: true, abre: '10:00', fecha: '19:00' }
  },

  /* ---- Equipe (páginas artista.html?a=<slug>) ------------------------
     Só o que está no Instagram de cada um. "whatsapp" vazio = A CONFIRMAR.
  ------------------------------------------------------------------ */
  artistas: [
    {
      slug: 'leti', nome: 'Leti Mollicone', instagram: 'letimollicone', whatsapp: '',
      foto: 'fotos/leti-perfil.jpg', cor: 'laranja',
      linha: 'Tatuagem · perfuração corporal · serigrafia · arte autoral',
      estilos: ['Tatuagem', 'Arte autoral', 'Perfuração corporal em titânio', 'Serigrafia'],
      destaques: ['Disponíveis', 'Perfuração', 'Silk', 'Encaixes'],
      extra: { rotulo: 'Portfólio no Behance', url: 'https://www.behance.net/leticiamollico' },
      perfuracao: true,
      fotos: [
        { src: 'fotos/leti-4.jpg', alt: 'Ave-do-paraíso em traço preto no ombro e braço.' },
        { src: 'fotos/leti-2.jpg', alt: 'Post da Leti com o título "Tatuagem abstrata".', pos: '50% 30%' },
        { src: 'fotos/leti-1.jpg', alt: 'Arte da Leti: laranja com uma joia de perfuração no umbigo.' },
        { src: 'fotos/leti-3.jpg', alt: 'Entrada do estúdio, escada com portas vermelhas.', pos: '50% 40%' }
      ]
    },
    {
      slug: 'beco', nome: 'BECO', instagram: '_________beco', whatsapp: '5571992448580',
      whatsappVisivel: '(71) 99244-8580',
      foto: 'fotos/beco-perfil.jpg', cor: 'roxo',
      linha: 'Tatuador · tattoo artist',
      estilos: ['Tatuagem', 'Flashs', 'Desenho autoral do cliente'],
      destaques: ['Desavesso', 'Flashs', 'Tattoos'],
      fotos: [
        { src: 'fotos/beco-4.jpg', alt: 'Duas tatuagens em traço preto grosso na panturrilha: cachorro e personagem num muro de tijolos.' },
        { src: 'fotos/beco-2.jpg', alt: 'BECO no estúdio, com a parede de quadros e flashes atrás.' },
        { src: 'fotos/beco-1.jpg', alt: 'BECO de máscara, tatuando sob luz vermelha.', pos: '40% 30%' }
      ]
    },
    {
      slug: 'olhos-felinos', nome: 'Olhos Felinos', instagram: 'olhosfelinos', whatsapp: '',
      foto: 'fotos/olhos-felinos-perfil.jpg', cor: 'verde',
      linha: 'Tatuagens exclusivas e blackwork',
      estilos: ['Blackwork', 'Botânica', 'Ornamental', 'Fineline', 'Tatuagens exclusivas'],
      destaques: ['Flashes', 'Studio', 'Sereia', 'Ornamentais', 'Botânica'],
      fotos: [
        { src: 'fotos/olhos-felinos-4.jpg', alt: 'Tigre em blackwork descendo pelo braço.' },
        { src: 'fotos/olhos-felinos-1.jpg', alt: 'Olhos Felinos tatuando, com o aviso "Agenda aberta, Salvador".', pos: '50% 35%' },
        { src: 'fotos/olhos-felinos-2.jpg', alt: 'Olhos Felinos atendendo na maca do estúdio.' },
        { src: 'fotos/olhos-felinos-3.jpg', alt: 'Olhos Felinos no estúdio, em frente aos quadros.' }
      ]
    },
    {
      slug: 'caio-tatu', nome: 'Caio Tatu', instagram: 'qaiotatu', whatsapp: '',
      foto: 'fotos/caio-tatu-perfil.jpg', cor: 'lilas',
      linha: 'Tatuagem, desenho e pintura',
      estilos: ['Tatuagem', 'Desenho', 'Pintura', 'Cores'],
      fotos: [
        { src: 'fotos/caio-tatu-1.jpg', alt: 'Ramo de oliveira colorido atrás da orelha.' },
        { src: 'fotos/caio-tatu-3.jpg', alt: 'Ombro com abelhas, favo e ondas em traço preto.' },
        { src: 'fotos/caio-tatu-2.jpg', alt: 'Caio tatuando no escuro, com luz de luminária.' }
      ]
    }
  ],

  // Tatuagem não tem preço fixo: tudo sai como "sob orçamento" (preco 0).
  // Durações A CONFIRMAR: servem só para reservar o tempo certo na agenda.
  // apenas_barbeiro_id: o serviço só aparece para esse artista.
  // sem_projeto: pula as perguntas de tatuagem (estilo, tamanho...).
  servicosDemo: [
    { id:'orcamento',      nome:'Conversa de orçamento', descricao:'30 min com o artista para ver a ideia, o local e o tamanho, e fechar valor e data.', preco_centavos:0, a_partir_de:false, duracao_min:30,  categoria:'Tatuagem' },
    { id:'sessao-pequena', nome:'Sessão pequena',        descricao:'Peças menores, até uns 10 cm.',                                              preco_centavos:0, a_partir_de:false, duracao_min:120, categoria:'Tatuagem' },
    { id:'sessao-media',   nome:'Sessão média',          descricao:'Peças com mais detalhe: antebraço, panturrilha, costela.',                    preco_centavos:0, a_partir_de:false, duracao_min:240, categoria:'Tatuagem' },
    { id:'sessao-longa',   nome:'Sessão longa',          descricao:'Tarde inteira para projetos grandes.',                                        preco_centavos:0, a_partir_de:false, duracao_min:360, categoria:'Tatuagem' },
    { id:'retoque',        nome:'Retoque',               descricao:'Para tattoo já cicatrizada que precisa de reforço.',                          preco_centavos:0, a_partir_de:false, duracao_min:60,  categoria:'Tatuagem' },
    { id:'perfuracao',     nome:'Perfuração corporal',   descricao:'Com a Leti Mollicone, joias em titânio.',                                     preco_centavos:0, a_partir_de:false, duracao_min:30,  categoria:'Perfuração', apenas_barbeiro_id:'leti', sem_projeto:true }
  ],

  /* ---- Estilos e técnica que aparecem no pedido ---------------------
     Tirados das bios dos artistas. A CONFIRMAR com o estúdio.
  ------------------------------------------------------------------ */
  estilos: ['Blackwork', 'Fineline', 'Botânica', 'Ornamental', 'Colorida', 'Flash (desenho pronto)', 'Arte autoral do artista', 'Trago meu desenho', 'Ainda não sei'],
  tecnicas: ['Com máquina', 'Handpoke (sem máquina)', 'Tanto faz']
};

// o motor chama os artistas de "barbeiros" (nome herdado, não aparece na tela)
window.TV.barbeirosDemo = window.TV.artistas.map(function (a) {
  return { id: a.slug, slug: a.slug, nome: a.nome, foto: a.foto, instagram: a.instagram,
           whatsapp: a.whatsapp, cargo: a.linha };
});
window.TV.artistaPor = function (chave) {
  return window.TV.artistas.filter(function (a) {
    return a.slug === chave || a.nome === chave || a.instagram === chave;
  })[0] || null;
};
window.TV.modoDemo = !(window.TV.supabaseUrl && window.TV.supabaseKey);
