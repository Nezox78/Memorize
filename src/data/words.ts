import type { ThemeId, Word } from '../logic/engine';

// Format compact : "français=anglais", séparés par ";".
// L'index du tableau correspond au niveau de départ (0 = Débutant … 4 = Expert).
const RAW: string[] = [
  // Débutant
  `chat=cat;chien=dog;maison=house;eau=water;pain=bread;livre=book;voiture=car;soleil=sun;lune=moon;arbre=tree;
  fleur=flower;pomme=apple;lait=milk;école=school;ami=friend;famille=family;mère=mother;père=father;frère=brother;
  sœur=sister;enfant=child;homme=man;femme=woman;garçon=boy;fille=girl;main=hand;pied=foot;tête=head;œil=eye;
  bouche=mouth;nez=nose;porte=door;fenêtre=window;table=table;chaise=chair;lit=bed;ville=city;rue=street;jour=day;
  nuit=night;matin=morning;soir=evening;rouge=red;bleu=blue;vert=green;noir=black;blanc=white;grand=big;petit=small;
  chaud=hot;froid=cold;bon=good;mauvais=bad;heureux=happy;triste=sad;manger=to eat;boire=to drink;dormir=to sleep;
  parler=to speak;marcher=to walk;courir=to run;lire=to read;écrire=to write;oui=yes;non=no;merci=thank you;
  bonjour=hello;fromage=cheese;œuf=egg;poisson=fish;oiseau=bird;cheval=horse;mer=sea;ciel=sky;pluie=rain;neige=snow;
  train=train;bus=bus;riz=rice;beurre=butter;soupe=soup;thé=tea;café=coffee;fruit=fruit;gâteau=cake;
  hôpital=hospital;église=church;pull=sweater;jupe=skirt`,

  // Novice
  `cuisine=kitchen;chambre=bedroom;salle de bain=bathroom;jardin=garden;clé=key;montre=watch;chemise=shirt;
  pantalon=trousers;chaussure=shoe;chapeau=hat;manteau=coat;robe=dress;travail=work;argent=money;magasin=shop;
  marché=market;gare=train station;aéroport=airport;avion=plane;bateau=boat;vélo=bicycle;pont=bridge;route=road;
  montagne=mountain;rivière=river;forêt=forest;plage=beach;île=island;pays=country;monde=world;semaine=week;
  mois=month;année=year;hier=yesterday;aujourd'hui=today;demain=tomorrow;toujours=always;jamais=never;
  souvent=often;parfois=sometimes;facile=easy;difficile=difficult;rapide=fast;lent=slow;cher=expensive;
  propre=clean;sale=dirty;plein=full;vide=empty;nouveau=new;vieux=old;jeune=young;fort=strong;faible=weak;
  acheter=to buy;vendre=to sell;ouvrir=to open;fermer=to close;apprendre=to learn;comprendre=to understand;
  écouter=to listen;regarder=to look at;attendre=to wait;chercher=to look for;trouver=to find;donner=to give;
  prendre=to take;cuisiner=to cook;nager=to swim;chanter=to sing;danser=to dance;voyager=to travel;
  médecin=doctor;professeur=teacher;voisin=neighbour;légume=vegetable;viande=meat;sucre=sugar;sel=salt;
  couteau=knife;fourchette=fork;cuillère=spoon;verre=glass;assiette=plate;chaussette=sock;veste=jacket;
  écharpe=scarf;gant=glove;ceinture=belt;cravate=tie;poche=pocket;camion=truck;moto=motorbike;métro=subway;
  roue=wheel;bibliothèque=library;usine=factory;immeuble=building;poulet=chicken;fraise=strawberry;oignon=onion;
  pomme de terre=potato;petit-déjeuner=breakfast`,

  // Intermédiaire
  `environnement=environment;réunion=meeting;entreprise=company;salaire=salary;facture=bill;loyer=rent;impôt=tax;
  emploi=job;chômage=unemployment;concurrence=competition;client=customer;rendez-vous=appointment;conseil=advice;
  choix=choice;but=goal;rêve=dream;souvenir=memory;habitude=habit;santé=health;maladie=illness;blessure=injury;
  douleur=pain;ordonnance=prescription;bruit=noise;odeur=smell;goût=taste;colère=anger;peur=fear;joie=joy;
  honte=shame;fierté=pride;confiance=trust;espoir=hope;ennui=boredom;améliorer=to improve;réussir=to succeed;
  échouer=to fail;essayer=to try;oublier=to forget;se souvenir=to remember;emprunter=to borrow;prêter=to lend;
  partager=to share;choisir=to choose;construire=to build;détruire=to destroy;grandir=to grow up;
  déménager=to move house;embaucher=to hire;licencier=to lay off;dépenser=to spend;économiser=to save;
  gagner=to win;perdre=to lose;éviter=to avoid;prévenir=to warn;se plaindre=to complain;remercier=to thank;
  fiable=reliable;têtu=stubborn;timide=shy;paresseux=lazy;généreux=generous;jaloux=jealous;poli=polite;
  grossier=rude;courageux=brave;épuisé=exhausted;inquiet=worried;déçu=disappointed;surpris=surprised;
  pourtant=however;plutôt=rather;presque=almost;déjà=already;bientôt=soon;partout=everywhere;ailleurs=elsewhere;
  malgré=despite;gouvernement=government;loi=law;preuve=evidence;tribunal=court;bouton=button;manche=sleeve;
  col=collar;volant=steering wheel;pneu=tyre;frein=brake;moteur=engine;coffre=trunk;mairie=town hall;
  autoroute=motorway;trottoir=pavement;carrefour=crossroads;farine=flour;ail=garlic;champignon=mushroom;
  miel=honey;recette=recipe;imperméable=raincoat;survêtement=tracksuit`,

  // Avancé
  `défi=challenge;atout=asset;lacune=gap;aperçu=overview;échéance=deadline;pénurie=shortage;déclin=decline;
  fardeau=burden;méfiance=distrust;soulagement=relief;chagrin=grief;mépris=contempt;remords=remorse;
  rancune=grudge;sagesse=wisdom;lâcheté=cowardice;témoin=witness;otage=hostage;émeute=riot;grève=strike;
  scrutin=ballot;pot-de-vin=bribe;contrefaçon=counterfeit;escroquerie=scam;cambriolage=burglary;procès=trial;
  amende=fine;sécheresse=drought;inondation=flood;tremblement de terre=earthquake;marée=tide;récolte=harvest;
  engrais=fertilizer;mauvaise herbe=weed;ruche=beehive;écureuil=squirrel;hibou=owl;requin=shark;baleine=whale;
  atteindre=to reach;accomplir=to achieve;entreprendre=to undertake;négliger=to neglect;soulager=to relieve;
  nuire=to harm;tromper=to deceive;avouer=to confess;nier=to deny;supplier=to beg;se vanter=to boast;
  se méfier=to be wary;bouleverser=to upset;éblouir=to dazzle;renverser=to spill;déchirer=to tear;plier=to fold;
  verser=to pour;mâcher=to chew;avaler=to swallow;frissonner=to shiver;bâiller=to yawn;ronfler=to snore;
  éternuer=to sneeze;boiter=to limp;maladroit=clumsy;rusé=cunning;avare=stingy;étourdi=absent-minded;
  louche=shady;épais=thick;mince=thin;lisse=smooth;rugueux=rough;tiède=lukewarm;émoussé=blunt;
  néanmoins=nevertheless;désormais=from now on;d'ailleurs=besides;quant à=as for;à peine=barely;
  en revanche=on the other hand;auparavant=previously;durable=sustainable;rentable=profitable;lacet=shoelace;
  fermeture éclair=zip;pare-brise=windscreen;remorque=trailer;embrayage=clutch;rétroviseur=rear-view mirror;
  barrage=dam;entrepôt=warehouse;échangeur=interchange;levure=yeast;persil=parsley;noisette=hazelnut;
  courgette=zucchini;aubergine=eggplant`,

  // Expert
  `éphémère=short-lived;désinvolte=offhand;acharné=relentless;farouche=fierce;chatoyant=shimmering;
  flâner=to stroll;dépaysement=change of scenery;envergure=wingspan;échafaudage=scaffolding;engouement=craze;
  aubaine=windfall;écueil=pitfall;entrave=hindrance;leurre=decoy;guet-apens=ambush;sursis=reprieve;
  carence=deficiency;fléau=scourge;tollé=outcry;clivage=divide;mainmise=stranglehold;engrenage=cogwheel;
  verrou=bolt;charnière=hinge;écrou=nut;tournevis=screwdriver;enclume=anvil;fourreau=scabbard;linceul=shroud;
  sillage=wake;écume=foam;houle=swell;crépuscule=dusk;aube=dawn;brume=mist;givre=frost;bourrasque=gust;
  averse=downpour;éboulement=landslide;ronce=bramble;chardon=thistle;houx=holly;gui=mistletoe;chêne=oak;
  hêtre=beech;bouleau=birch;saule=willow;blaireau=badger;belette=weasel;hérisson=hedgehog;libellule=dragonfly;
  coccinelle=ladybird;rouge-gorge=robin;hirondelle=swallow;têtard=tadpole;ressasser=to dwell on;
  tergiverser=to dither;chuchoter=to whisper;balbutier=to stammer;grommeler=to grumble;gémir=to groan;
  trébucher=to stumble;chanceler=to stagger;rôder=to prowl;épier=to spy on;froisser=to crumple;pétrir=to knead;
  ébrécher=to chip;émietter=to crumble;tamiser=to sift;étancher=to quench;esquiver=to dodge;choyer=to pamper;
  enjôler=to coax;narguer=to taunt;houspiller=to scold;saugrenu=preposterous;cocasse=comical;blafard=wan;
  penaud=sheepish;revêche=surly;mesquin=petty;sournois=sly;vétuste=dilapidated;exigu=cramped;touffu=bushy;
  rêche=coarse;à l'improviste=unexpectedly;en catimini=on the sly;d'emblée=from the outset;ourlet=hem;
  doublure=lining;essieu=axle;péniche=barge;écluse=lock;passerelle=footbridge;beffroi=belfry;ciboulette=chives;
  coing=quince;groseille=redcurrant;bretelles=braces;boutonnière=buttonhole;pare-chocs=bumper;
  enjoliveur=hubcap`,
];

// Mots rattachés à un thème ; tous les autres vont dans « Vocabulaire général ».
const THEME_WORDS: Record<string, string> = {
  food: `pain;pomme;lait;fromage;œuf;poisson;eau;manger;boire;riz;beurre;soupe;thé;café;fruit;gâteau;légume;viande;
    sucre;sel;cuisiner;couteau;fourchette;cuillère;verre;assiette;poulet;fraise;oignon;pomme de terre;
    petit-déjeuner;goût;farine;ail;champignon;miel;recette;mâcher;avaler;récolte;levure;persil;noisette;
    courgette;aubergine;pétrir;émietter;tamiser;ciboulette;coing;groseille`,
  clothes: `pull;jupe;montre;chemise;pantalon;chaussure;chapeau;manteau;robe;chaussette;veste;écharpe;gant;
    ceinture;cravate;poche;bouton;manche;col;imperméable;survêtement;lacet;fermeture éclair;ourlet;doublure;
    bretelles;boutonnière`,
  vehicles: `voiture;train;bus;avion;bateau;vélo;camion;moto;métro;roue;volant;pneu;frein;moteur;coffre;
    pare-brise;remorque;embrayage;rétroviseur;essieu;péniche;pare-chocs;enjoliveur;voyager`,
  places: `maison;école;ville;rue;porte;fenêtre;hôpital;église;cuisine;chambre;salle de bain;jardin;magasin;
    marché;gare;aéroport;pont;route;bibliothèque;usine;immeuble;mairie;autoroute;trottoir;carrefour;tribunal;
    barrage;entrepôt;échangeur;échafaudage;écluse;passerelle;beffroi`,
};

const split = (block: string) =>
  block
    .split(';')
    .map((entry) => entry.trim())
    .filter(Boolean);

const themeOf = new Map<string, ThemeId>();
for (const [theme, block] of Object.entries(THEME_WORDS)) {
  for (const french of split(block)) themeOf.set(french, theme);
}

export const WORDS: Word[] = RAW.flatMap((block, level) =>
  split(block).map((entry) => {
    const [french, english] = entry.split('=');
    return { french, english, level, theme: themeOf.get(french) ?? 'general' };
  }),
);

export const THEMES: { id: ThemeId; name: string; text: string }[] = [
  { id: 'food', name: 'Aliments', text: 'Fruits, légumes, boissons, repas…' },
  { id: 'clothes', name: 'Vêtements', text: 'Habits, chaussures, accessoires…' },
  { id: 'vehicles', name: 'Véhicules', text: 'Voitures, transports, moyens de locomotion…' },
  { id: 'places', name: 'Infrastructures', text: 'Bâtiments, lieux publics, architectures…' },
  { id: 'general', name: 'Vocabulaire général', text: 'Tous les autres mots du quotidien…' },
];
