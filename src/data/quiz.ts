/**
 * Quiz « À quel copain ressembles-tu ? »
 *
 * Chaque réponse liste les copains (slugs de characters.ts) qui répondraient ça.
 * Calcul : chaque réponse choisie donne 1 point aux copains cités ; le copain qui a le plus
 * de points gagne (en cas d'égalité : celui qui a collé aux dernières questions, les plus précises).
 *
 * Pour un résultat juste, chaque copain devrait être cité dans chaque question.
 * Copains : dim, guigui, dauby, donne, lenoir, aubin, coco, laurent, merlot, nael, petit,
 * szabo, turquet, fred, hugo, saby, theo, rene, momo.
 */
export interface QuizAnswer {
  text: string;
  who: string[];
}

export interface QuizQuestion {
  question: string;
  answers: QuizAnswer[];
}

export const quiz: QuizQuestion[] = [
  {
    question: 'Il est 3 h du matin. Quelle est la suite ?',
    answers: [
      { text: '« On va en boîte ? »', who: ['dim', 'fred', 'donne', 'dauby', 'coco', 'merlot', 'petit', 'momo', 'theo'] },
      { text: '« On commande à manger ? »', who: ['rene'] },
      { text: '« Allez, une dernière et on rentre. »', who: ['guigui'] },
      { text: 'Tu dors déjà depuis longtemps', who: ['turquet', 'lenoir', 'aubin', 'laurent'] },
      { text: 'Personne ne sait où tu es passé (tu es rentré sans dire au revoir)', who: ['hugo'] },
    ],
  },
  {
    question: 'Un pote a besoin d’aide pour déménager.',
    answers: [
      { text: 'Tu arrives à 8 h avec le café', who: ['dim', 'guigui', 'aubin', 'coco', 'merlot', 'hugo'] },
      { text: 'Tu viens, mais plutôt vers 11 h', who: ['turquet', 'fred', 'saby'] },
      { text: 'Tu portes deux cartons et c’est fini', who: ['dauby', 'laurent', 'petit', 'momo', 'rene'] },
      { text: 'Tu trouves miraculeusement quelque chose de prévu ce jour-là', who: ['nael', 'szabo'] },
      { text: 'Tu viens surtout pour l’apéro de fin', who: ['donne'] },
    ],
  },
  {
    question: 'En vacances avec les copains, tu es…',
    answers: [
      { text: 'Celui qui veut visiter absolument tout', who: ['dim', 'guigui', 'dauby', 'lenoir', 'fred', 'hugo', 'momo', 'aubin', 'coco', 'merlot', 'petit', 'szabo', 'saby'] },
      { text: 'Celui qui reste au logement durant tout le séjour', who: ['donne', 'laurent', 'nael', 'turquet', 'theo'] },
    ],
  },
  {
    question: 'On te confie l’organisation d’une soirée.',
    answers: [
      { text: 'Tableau, horaires, courses : tout est prévu (surtout les boissons)', who: ['dim', 'guigui', 'dauby', 'aubin', 'coco', 'merlot', 'hugo'] },
      { text: 'Tu crées juste le groupe WhatsApp', who: ['lenoir', 'laurent', 'turquet', 'petit'] },
      { text: 'Tu improvises tout le jour même. Très mauvaise idée de t’avoir confié ça', who: ['donne', 'nael', 'szabo', 'fred', 'momo'] },
    ],
  },
  {
    question: 'Dans un débat entre potes, tu…',
    answers: [
      { text: 'Veux absolument avoir raison', who: ['donne', 'lenoir', 'coco', 'laurent', 'petit', 'szabo'] },
      { text: 'Peux changer d’avis si les arguments sont forts', who: ['dim', 'dauby', 'aubin', 'fred', 'hugo', 'momo'] },
      { text: 'Mets de l’huile sur le feu juste pour voir', who: ['guigui', 'merlot'] },
      { text: 'Regardes le chaos en mangeant des chips', who: ['nael'] },
    ],
  },
  {
    question: 'Ton rapport au sport ?',
    answers: [
      { text: 'Une religion', who: ['guigui', 'saby', 'szabo'] },
      { text: 'J’en fais régulièrement, mais faut pas déconner non plus', who: ['donne', 'lenoir', 'petit', 'turquet', 'fred', 'dauby', 'merlot', 'hugo', 'momo'] },
      { text: 'Seulement s’il y a des copains', who: ['aubin', 'coco', 'nael', 'theo'] },
      { text: 'Je préfère regarder les autres en faire', who: ['dim', 'laurent', 'rene'] },
    ],
  },
  {
    question: 'On te laisse choisir la musique en soirée.',
    answers: [
      { text: 'JUL, évidemment', who: ['donne', 'lenoir', 'nael', 'turquet', 'momo'] },
      { text: 'Hard / hardcore / techno, et tant pis pour les autres', who: ['dim', 'coco', 'petit', 'hugo', 'rene', 'theo'] },
      { text: 'Des classiques que tout le monde connaît', who: ['guigui', 'dauby', 'aubin', 'laurent', 'merlot', 'szabo', 'fred', 'saby'] },
    ],
  },
  {
    question: 'Après une soirée beaucoup trop arrosée, le lendemain…',
    answers: [
      { text: 'Je suis debout à 9 h comme si de rien n’était', who: ['dim', 'guigui', 'aubin', 'merlot', 'saby'] },
      { text: 'J’ai une gueule de bois monumentale mais aucun regret', who: ['dauby', 'coco', 'petit', 'lenoir', 'laurent', 'momo', 'rene'] },
      { text: 'Je dois demander aux autres comment ma soirée s’est terminée, je suis à l’hôpital', who: ['fred', 'theo', 'hugo'] },
      { text: 'Tu proposes déjà l’apéro', who: ['donne', 'turquet', 'nael'] },
      { text: 'J’ai fait pipi au lit', who: ['theo', 'szabo'] },
    ],
  },
  {
    question: 'On te perd en festival. Où a-t-on le plus de chances de te retrouver ?',
    answers: [
      { text: 'Tout devant au milieu de la foule', who: ['fred', 'dim', 'momo'] },
      { text: 'À la buvette', who: ['guigui', 'lenoir', 'aubin', 'laurent', 'merlot'] },
      { text: 'Avec un groupe de gens que personne ne connaît', who: ['coco', 'szabo', 'theo'] },
      { text: 'En train d’acheter de la drogue', who: ['dauby', 'rene', 'petit', 'nael', 'donne'] },
      { text: 'Absolument aucune idée. Bonne chance.', who: ['hugo'] },
    ],
  },
  {
    question: 'À l’apéro, tu es plutôt…',
    answers: [
      { text: 'Celui qui prépare les meilleurs trucs à manger', who: ['dauby', 'aubin', 'laurent', 'hugo'] },
      { text: 'Celui qui arrive avec beaucoup trop d’alcool', who: ['dim', 'guigui', 'coco'] },
      { text: 'Celui qui arrive les mains vides', who: ['nael', 'szabo', 'donne', 'petit', 'theo'] },
      { text: 'Celui qui dit « juste un verre » et finit à 4 h', who: ['merlot', 'lenoir', 'turquet', 'fred', 'momo'] },
      { text: 'Celui qui demande s’il y a quelque chose de végé', who: ['saby'] },
    ],
  },
  {
    question: 'Ton téléphone après une soirée ressemble plutôt à…',
    answers: [
      { text: '47 photos et vidéos incompréhensibles', who: ['aubin', 'dauby'] },
      { text: 'Des nouveaux numéros dont je ne connais plus les propriétaires', who: ['coco', 'theo', 'szabo', 'momo'] },
      { text: 'Trois messages très sérieux envoyés à 3 h 42', who: ['guigui', 'turquet'] },
      { text: '2 % de batterie et personne n’arrivait à me joindre', who: ['nael', 'donne', 'fred'] },
      { text: 'Rien du tout, j’ai été étonnamment raisonnable', who: ['laurent', 'dim', 'merlot', 'saby'] },
    ],
  },
  {
    question: 'Le groupe propose un week-end dans trois semaines. Tu…',
    answers: [
      { text: 'Réponds « CHAUD » en moins de 30 secondes', who: ['guigui', 'dim', 'momo'] },
      { text: 'Réponds « je vous redis » et oublies de redire', who: ['lenoir', 'laurent', 'fred', 'szabo'] },
      { text: 'Ne lis pas les 86 messages et demandes un résumé', who: ['nael', 'petit'] },
      { text: 'Suis le mouvement : dites-moi juste où et quand', who: ['merlot'] },
    ],
  },
  {
    question: 'En soirée, tu es celui qui…',
    answers: [
      { text: 'Termine systématiquement parmi les derniers', who: ['dim', 'fred', 'dauby', 'donne'] },
      { text: 'Se fait commander un Uber pour rentrer', who: ['laurent', 'nael', 'petit', 'turquet', 'theo'] },
      { text: 'Mets des gros tunnels à tout le monde', who: ['coco', 'lenoir'] },
      { text: 'Disparaît mystérieusement à un moment de la soirée', who: ['hugo', 'momo'] },
      { text: 'Parle politique', who: ['szabo'] },
    ],
  },
  {
    question: 'Une galère arrive en vacances. Votre logement est fermé et personne ne répond. Tu…',
    answers: [
      { text: 'Prends immédiatement les choses en main', who: ['dim', 'hugo', 'coco', 'petit'] },
      { text: 'Appelles absolument tous les numéros disponibles', who: ['guigui', 'merlot', 'momo'] },
      { text: 'Fais des blagues pendant que les autres cherchent une solution', who: ['dauby', 'lenoir', 'aubin', 'laurent', 'theo', 'fred'] },
      { text: 'Proposes d’aller boire un verre en attendant', who: ['donne', 'nael', 'turquet', 'saby'] },
    ],
  },
  {
    question: 'Quand il s’agit de draguer, tu es plutôt…',
    answers: [
      { text: 'Je tente ma chance, on verra bien', who: ['guigui', 'fred', 'petit', 'theo'] },
      { text: 'Je deviens pote avec elle avant même d’avoir essayé de la draguer', who: ['momo', 'turquet'] },
      { text: 'Deux verres et soudain j’ai beaucoup plus confiance en moi', who: ['lenoir', 'laurent', 'nael', 'aubin'] },
      { text: 'Je suis persuadé d’être très fort… mes potes sont moins convaincus', who: ['szabo', 'coco'] },
      { text: 'Je ne drague personne, c’est généralement l’inverse', who: ['dim', 'merlot', 'rene'] },
    ],
  },
  {
    question: 'Tu participes à une émission de télé-réalité. Tu es…',
    answers: [
      { text: 'Celui qui crée des embrouilles dès le premier épisode', who: ['nael', 'donne', 'dauby', 'fred', 'theo'] },
      { text: 'Celui qui tombe amoureux au bout de 48 heures', who: ['lenoir', 'turquet', 'momo'] },
      { text: 'Celui qui élabore des stratégies pour gagner', who: ['hugo', 'dim', 'guigui'] },
      { text: 'Celui qui se fait éliminer parce qu’on l’a oublié', who: ['saby', 'aubin', 'laurent'] },
    ],
  },
  {
    question: 'Tu gagnes 1 million d’euros. Ta première réaction ?',
    answers: [
      { text: 'Je démissionne et je pars faire le tour du monde', who: ['dim', 'szabo', 'fred'] },
      { text: 'J’achète une maison et je place le reste', who: ['guigui', 'donne', 'lenoir', 'petit', 'turquet', 'hugo'] },
      { text: 'J’organise une fête monumentale avec tous les copains', who: ['coco', 'merlot', 'rene', 'theo'] },
      { text: 'Je ne dis rien à personne, bande de profiteurs', who: ['dauby', 'aubin', 'laurent', 'nael', 'momo'] },
    ],
  },
  {
    question: 'Tu te retrouves sur une île déserte avec trois copains. Tu…',
    answers: [
      { text: 'Construis un abri et organises la survie', who: ['dauby', 'aubin', 'merlot', 'fred', 'saby'] },
      { text: 'Cherches immédiatement quelque chose à manger', who: ['dim', 'lenoir', 'szabo', 'hugo', 'theo'] },
      { text: 'Te proclames chef de l’île', who: ['coco', 'guigui'] },
      { text: 'Paniques parce qu’il n’y a ni réseau ni toilettes', who: ['petit', 'laurent', 'momo', 'rene', 'nael', 'turquet'] },
    ],
  },
  {
    question: 'Si tu devais passer à la télé, ce serait plutôt pour…',
    answers: [
      { text: 'Avoir gagné un championnat complètement improbable', who: ['saby', 'dim', 'merlot', 'fred', 'lenoir'] },
      { text: 'Être interviewé dans un reportage sur les voisins insupportables', who: ['guigui', 'petit', 'szabo'] },
      { text: 'Participer à Questions pour un champion et contester les réponses', who: ['aubin', 'laurent', 'coco', 'rene'] },
      { text: 'Apparaître en arrière-plan d’un reportage, complètement bourré', who: ['donne', 'turquet', 'nael', 'theo'] },
    ],
  },
];
