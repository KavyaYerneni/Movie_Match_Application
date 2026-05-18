/**
 * Generates movies.json with real movie posters (Cinemeta / IMDb via Stremio API).
 * Run: node generate-movies.js  (takes ~30s)
 */
const fs = require('fs');
const path = require('path');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function posterFromImdb(imdbId) {
  return `https://images.metahub.space/poster/large/${imdbId}/img`;
}

async function lookupPoster(label, year) {
  const queries = [
    `${label} ${year}`,
    label,
    label.replace(/:.*$/, '').trim(),
  ];

  for (const q of queries) {
    try {
      const res = await fetch(
        `https://v3-cinemeta.strem.io/catalog/movie/top/search=${encodeURIComponent(q)}.json`
      );
      const data = await res.json();
      const metas = data.metas || [];
      const match =
        metas.find(
          (m) =>
            m.name?.toLowerCase() === label.toLowerCase() &&
            (!m.releaseInfo || m.releaseInfo === String(year))
        ) ||
        metas.find((m) => m.releaseInfo === String(year)) ||
        metas[0];

      if (!match) continue;

      const imdb = match.imdb_id || match.id;
      if (imdb?.startsWith('tt')) {
        return { image_url: posterFromImdb(imdb), imdb_id: imdb };
      }
      if (match.poster) {
        return { image_url: match.poster, imdb_id: imdb };
      }
    } catch {
      /* try next query */
    }
    await sleep(120);
  }
  return null;
}

const raw = [
  ['The Shawshank Redemption', 1994, 'Drama', 'Two imprisoned men bond over years, finding solace and redemption through acts of common decency.'],
  ['The Godfather', 1972, 'Crime', 'The aging patriarch of an organized crime dynasty transfers control of his clandestine empire to his reluctant son.'],
  ['The Dark Knight', 2008, 'Action', 'Batman raises the stakes in his war on crime with the help of Lt. Gordon and District Attorney Harvey Dent.'],
  ['Pulp Fiction', 1994, 'Crime', 'The lives of two mob hitmen, a boxer, a gangster and his wife intertwine in four tales of violence and redemption.'],
  ['Forrest Gump', 1994, 'Drama', 'The presidencies of Kennedy and Johnson unfold through the perspective of an Alabama man with a kind heart.'],
  ['Inception', 2010, 'Sci-Fi', 'A thief who steals corporate secrets through dream-sharing technology is offered a chance at redemption.'],
  ['Fight Club', 1999, 'Drama', 'An insomniac office worker and a devil-may-care soap maker form an underground fight club that evolves into much more.'],
  ['The Matrix', 1999, 'Sci-Fi', 'A computer hacker learns from mysterious rebels about the true nature of his reality and his role in the war against its controllers.'],
  ['Goodfellas', 1990, 'Crime', 'The story of Henry Hill and his life in the mob, covering his relationship with his wife and his partners from 1955 to 1980.'],
  ['The Silence of the Lambs', 1991, 'Thriller', 'A young F.B.I. cadet must receive the help of an incarcerated cannibal killer to catch another serial killer.'],
  ['Interstellar', 2014, 'Sci-Fi', 'A team of explorers travel through a wormhole in space in an attempt to ensure humanity\'s survival.'],
  ['Parasite', 2019, 'Thriller', 'Greed and class discrimination threaten the newly formed symbiotic relationship between the wealthy Park family and the destitute Kim clan.'],
  ['Spirited Away', 2001, 'Animation', 'During her family\'s move to the suburbs, a sullen 10-year-old girl wanders into a world ruled by gods and spirits.'],
  ['The Lord of the Rings: The Return of the King', 2003, 'Fantasy', 'Gandalf and Aragorn lead the World of Men against Sauron\'s army to draw his gaze from Frodo and Sam.'],
  ['Schindler\'s List', 1993, 'Drama', 'In German-occupied Poland, industrialist Oskar Schindler gradually becomes concerned for his Jewish workforce.'],
  ['12 Angry Men', 1957, 'Drama', 'A jury holdout attempts to prevent a miscarriage of justice by forcing his colleagues to reconsider the evidence.'],
  ['The Green Mile', 1999, 'Drama', 'The lives of guards on Death Row are affected by one of their charges: a black man accused of child murder.'],
  ['Gladiator', 2000, 'Action', 'A former Roman General sets out to exact vengeance against the corrupt emperor who murdered his family.'],
  ['The Prestige', 2006, 'Thriller', 'After a tragic accident, two stage magicians engage in a battle to create the ultimate illusion while sacrificing everything.'],
  ['The Departed', 2006, 'Crime', 'An undercover cop and a mole in the police attempt to identify each other while infiltrating an Irish gang in Boston.'],
  ['Whiplash', 2014, 'Drama', 'A promising young drummer enrolls at a cut-throat music conservatory where his dreams are mentored by an instructor who will stop at nothing.'],
  ['The Lion King', 1994, 'Animation', 'Lion prince Simba and his father are targeted by his bitter uncle, who wants to ascend the throne himself.'],
  ['Back to the Future', 1985, 'Sci-Fi', 'Marty McFly is accidentally sent thirty years into the past in a time-traveling DeLorean invented by his friend Doc Brown.'],
  ['Terminator 2: Judgment Day', 1991, 'Action', 'A cyborg identical to the one who failed to kill Sarah Connor must now protect her ten-year-old son from a more advanced android.'],
  ['Alien', 1979, 'Horror', 'The crew of a commercial spacecraft encounter a deadly lifeform after investigating an unknown transmission.'],
  ['Blade Runner 2049', 2017, 'Sci-Fi', 'Young Blade Runner K\'s discovery of a long-buried secret leads him to track down former Blade Runner Rick Deckard.'],
  ['Mad Max: Fury Road', 2015, 'Action', 'In a post-apocalyptic wasteland, Max teams up with a mysterious woman to escape from a tyrannical warlord.'],
  ['Jurassic Park', 1993, 'Adventure', 'A pragmatic paleontologist touring an almost complete theme park on an island must protect a couple of kids when dinosaurs break loose.'],
  ['E.T. the Extra-Terrestrial', 1982, 'Family', 'A troubled child summons the courage to help a friendly alien escape Earth and return to his home world.'],
  ['Toy Story', 1995, 'Animation', 'A cowboy doll is profoundly threatened when a new spaceman action figure supplants him as top toy in a boy\'s room.'],
  ['Finding Nemo', 2003, 'Animation', 'After his son is captured in the Great Barrier Reef, a timid clownfish sets out on a journey to bring him home.'],
  ['Up', 2009, 'Animation', '78-year-old Carl Fredricksen travels to Paradise Falls in his house equipped with balloons, inadvertently taking a young stowaway.'],
  ['WALL-E', 2008, 'Animation', 'In the distant future, a small waste-collecting robot inadvertently embarks on a space journey that will decide the fate of mankind.'],
  ['Coco', 2017, 'Animation', 'Aspiring musician Miguel confronts his family\'s ancestral ban on music and enters the Land of the Dead to find his great-great-grandfather.'],
  ['Inside Out', 2015, 'Animation', 'After young Riley moves to San Francisco, her emotions Joy, Fear, Anger, Disgust and Sadness conflict on how best to navigate life.'],
  ['Ratatouille', 2007, 'Animation', 'A rat who can cook makes an unusual alliance with a young kitchen worker at a famous restaurant in Paris.'],
  ['The Incredibles', 2004, 'Animation', 'A family of undercover superheroes, while trying to live the quiet suburban life, are forced into action to save the world.'],
  ['Monsters, Inc.', 2001, 'Animation', 'Monsters generate their city\'s power by scaring children, but they are terribly afraid themselves of being contaminated by kids.'],
  ['Shrek', 2001, 'Animation', 'A mean lord exiles fairytale creatures to the swamp of a grumpy ogre, who must go on a quest and rescue a princess.'],
  ['How to Train Your Dragon', 2010, 'Animation', 'A hapless young Viking who aspires to hunt dragons becomes the unlikely friend of a young dragon himself.'],
  ['Frozen', 2013, 'Animation', 'When the newly crowned Queen Elsa accidentally uses her power to turn things into ice, she may doom her kingdom.'],
  ['Moana', 2016, 'Animation', 'In Ancient Polynesia, a terrible curse incurred by the Demigod Maui reaches Moana, who answers the Ocean\'s call.'],
  ['Zootopia', 2016, 'Animation', 'In a city of anthropomorphic animals, a rookie bunny cop and a cynical con artist fox must work together to uncover a conspiracy.'],
  ['Big Hero 6', 2014, 'Animation', 'A special bond develops between plus-sized inflatable robot Baymax and prodigy Hiro Hamada, who together form a superhero team.'],
  ['La La Land', 2016, 'Romance', 'While navigating their careers in Los Angeles, a pianist and an actress fall in love while attempting to reconcile their aspirations.'],
  ['Your Name', 2016, 'Anime', 'Two strangers find themselves linked in a bizarre way when a connection forms between them.'],
  ['Akira', 1988, 'Anime', 'A secret military project endangers Neo-Tokyo when it turns a biker gang member into a rampaging psychic.'],
  ['Princess Mononoke', 1997, 'Anime', 'On a journey to find the cure for a curse, Ashitaka finds himself in the middle of a war between forest gods and humans.'],
  ['Howl\'s Moving Castle', 2004, 'Anime', 'When an unconfident young woman is cursed with an old body, her only chance at breaking it lies with a self-indulgent wizard.'],
  ['My Neighbor Totoro', 1988, 'Anime', 'When two girls move to the country, they have adventures with the wondrous forest spirits who live nearby.'],
  ['Grave of the Fireflies', 1988, 'Anime', 'A young boy and his little sister struggle to survive in Japan during World War II after losing their mother.'],
  ['Se7en', 1995, 'Thriller', 'Two detectives hunt a serial killer who uses the seven deadly sins as his motives in a grim, rain-soaked city.'],
  ['Memento', 2000, 'Thriller', 'A man with short-term memory loss attempts to track down his wife\'s murderer using notes, tattoos, and Polaroid photos.'],
  ['American History X', 1998, 'Drama', 'A former neo-nazi skinhead tries to prevent his younger brother from going down the same wrong path that he did.'],
  ['The Pianist', 2002, 'Drama', 'A Polish Jewish musician struggles to survive the destruction of the Warsaw ghetto during World War II.'],
  ['Life Is Beautiful', 1997, 'Drama', 'When an open-minded Jewish waiter and his son become victims of the Holocaust, he uses imagination to shield his boy.'],
  ['Pan\'s Labyrinth', 2006, 'Fantasy', 'In the Falangist Spain of 1944, a bookish young stepdaughter of a sadistic army officer escapes into a dark fantasy world.'],
  ['Oldboy', 2003, 'Thriller', 'After being kidnapped and imprisoned for fifteen years, Oh Dae-Su is released and given five days to find his captor.'],
  ['Get Out', 2017, 'Horror', 'A young African-American visits his white girlfriend\'s parents for the weekend, where his uneasiness about their reception grows.'],
  ['Black Panther', 2018, 'Action', 'T\'Challa, heir to the hidden kingdom of Wakanda, must lead his people into a new future and confront a challenger from his past.'],
  ['Spider-Man: Into the Spider-Verse', 2018, 'Animation', 'Teen Miles Morales becomes Spider-Man of his universe and must team with five counterparts from other dimensions.'],
  ['Avengers: Endgame', 2019, 'Action', 'After the devastating events of Infinity War, the universe is in ruins. The remaining Avengers assemble once more.'],
  ['Iron Man', 2008, 'Action', 'After being held captive, billionaire engineer Tony Stark creates a unique weaponized suit of armor to fight evil.'],
  ['Guardians of the Galaxy', 2014, 'Action', 'A group of intergalactic criminals must pull together to stop a fanatical warrior from taking control of the universe.'],
  ['Doctor Strange', 2016, 'Action', 'While on a journey of physical and spiritual healing, a brilliant neurosurgeon is drawn into the world of the mystic arts.'],
  ['Thor: Ragnarok', 2017, 'Action', 'Imprisoned on the planet Sakaar, Thor must race against time to return to Asgard and stop Ragnarök.'],
  ['Logan', 2017, 'Action', 'In a future where mutants are nearly extinct, an elderly Logan cares for an ailing Professor X on the Mexican border.'],
  ['Deadpool', 2016, 'Action', 'A wisecracking mercenary is experimented on and becomes immortal but ugly, and sets out to track down the man who ruined his looks.'],
  ['The Social Network', 2010, 'Drama', 'As Harvard student Mark Zuckerberg creates the social networking site that would become Facebook, he faces legal complications.'],
  ['The Wolf of Wall Street', 2013, 'Drama', 'Based on the true story of Jordan Belfort, from his rise to a wealthy stock-broker to his dramatic fall.'],
  ['No Country for Old Men', 2007, 'Thriller', 'Violence and mayhem ensue after a hunter stumbles upon a drug deal gone wrong and more than two million dollars in cash.'],
  ['The Big Lebowski', 1998, 'Comedy', 'Jeff "The Dude" Lebowski, mistaken for a millionaire of the same name, seeks restitution for his ruined rug.'],
  ['Django Unchained', 2012, 'Western', 'With the help of a German bounty hunter, a freed slave sets out to rescue his wife from a brutal Mississippi plantation owner.'],
  ['Inglourious Basterds', 2009, 'War', 'In Nazi-occupied France, a plan to assassinate Nazi leaders by a group of Jewish U.S. soldiers coincides with a theatre owner\'s revenge.'],
  ['Kill Bill: Vol. 1', 2003, 'Action', 'After awakening from a four-year coma, a former assassin wreaks vengeance on the team of assassins who betrayed her.'],
  ['Reservoir Dogs', 1992, 'Crime', 'When a simple jewelry heist goes wrong, the surviving criminals begin to suspect that one of them is a police informant.'],
  ['300', 2006, 'Action', 'King Leonidas of Sparta and a force of 300 men fight the Persians at Thermopylae in 480 B.C.'],
  ['V for Vendetta', 2005, 'Sci-Fi', 'In a future British dystopian society, a shadowy freedom fighter plots to overthrow the tyrannical government.'],
  ['Arrival', 2016, 'Sci-Fi', 'A linguist works with the military to communicate with alien lifeforms after twelve mysterious spacecraft appear worldwide.'],
  ['Blade Runner', 1982, 'Sci-Fi', 'A blade runner must pursue and terminate four replicants who stole a ship in space and have returned to Earth.'],
  ['Dune', 2021, 'Sci-Fi', 'Paul Atreides, a brilliant young man born into a great destiny, must travel to the most dangerous planet in the universe.'],
  ['The Martian', 2015, 'Sci-Fi', 'An astronaut becomes stranded on Mars after his team assume him dead, and must rely on ingenuity to signal Earth.'],
  ['Gravity', 2013, 'Sci-Fi', 'Two astronauts work together to survive after an accident leaves them stranded in space with no connection to Earth.'],
  ['Hidden Figures', 2016, 'Drama', 'The story of a team of female African-American mathematicians who served a vital role in NASA during the space race.'],
  ['The Imitation Game', 2014, 'Drama', 'During World War II, mathematician Alan Turing tries to crack the German Enigma code with help from fellow mathematicians.'],
  ['A Beautiful Mind', 2001, 'Drama', 'After John Nash accepts secret work in cryptography, his life takes a turn for the nightmarish as he battles mental illness.'],
  ['Spotlight', 2015, 'Drama', 'The true story of how the Boston Globe uncovered the massive scandal of child molestation within the local Catholic Archdiocese.'],
  ['The Revenant', 2015, 'Adventure', 'A frontiersman on a fur trading expedition fights for survival after being mauled by a bear and left for dead.'],
  ['The Grand Budapest Hotel', 2014, 'Comedy', 'A writer encounters the owner of an aging European hotel, who tells him of his days serving as lobby boy to a legendary concierge.'],
  ['Moonrise Kingdom', 2012, 'Romance', 'A pair of young lovers flee their New England town, causing a local search party to fan out and find them.'],
  ['The Royal Tenenbaums', 2001, 'Comedy', 'The eccentric members of a dysfunctional family reluctantly gather under one roof for various reasons.'],
  ['Casablanca', 1942, 'Romance', 'A cynical expatriate American cafe owner struggles to decide whether or not to help his former lover escape Nazis in Morocco.'],
  ['Citizen Kane', 1941, 'Drama', 'Following the death of publishing tycoon Charles Foster Kane, reporters scramble to uncover the meaning of his final word.'],
  ['Psycho', 1960, 'Horror', 'A Phoenix secretary embezzles money and checks into a remote motel run by a young man under the domination of his mother.'],
  ['Jaws', 1975, 'Thriller', 'When a killer shark unleashes chaos on a beach community, a police chief, a scientist and a grizzled fisherman hunt it down.'],
  ['Raiders of the Lost Ark', 1981, 'Adventure', 'Archaeologist Indiana Jones is hired by the U.S. government to find the Ark of the Covenant before the Nazis can obtain it.'],
  ['Star Wars', 1977, 'Sci-Fi', 'Luke Skywalker joins forces with a Jedi Knight, a cocky pilot, a Wookiee and two droids to save the galaxy.'],
  ['Eternal Sunshine of the Spotless Mind', 2004, 'Romance', 'When their relationship turns sour, a couple undergoes a medical procedure to have each other erased from their memories.'],
  ['Her', 2013, 'Romance', 'In a near future, a lonely writer develops an unlikely relationship with an operating system designed to meet his every need.'],
  ['The Truman Show', 1998, 'Drama', 'An insurance salesman discovers his whole life is actually a reality TV show and must decide whether to escape.'],
  ['Groundhog Day', 1993, 'Comedy', 'A weatherman finds himself living the same day over and over again in a small Pennsylvania town.'],
  ['The Shining', 1980, 'Horror', 'A family heads to an isolated hotel for the winter where a sinister presence influences the father into violence.'],
  ['Aliens', 1986, 'Sci-Fi', 'Decades after surviving the Nostromo incident, Ellen Ripley is sent back to the moon LV-426 with a squad of marines.'],
  ['The Thing', 1982, 'Horror', 'A research team in Antarctica is hunted by a shape-shifting alien that assumes the appearance of its victims.'],
  ['Apocalypse Now', 1979, 'War', 'A U.S. Army officer serving in Vietnam is tasked with assassinating a renegade Special Forces Colonel.'],
  ['Full Metal Jacket', 1987, 'War', 'A pragmatic U.S. Marine observes the dehumanizing effects the Vietnam War has on his fellow recruits.'],
  ['Platoon', 1986, 'War', 'A young soldier in Vietnam faces a moral crisis when confronted with the horrors of war and the duality of man.'],
  ['Rocky', 1976, 'Drama', 'A small-time Philadelphia boxer gets a supremely rare chance to fight the heavyweight champion in a bout.'],
  ['Raging Bull', 1980, 'Drama', 'The life of boxer Jake LaMotta, whose violence and temper led him to the top in the ring but destroyed his life outside it.'],
  ['Scarface', 1983, 'Crime', 'In 1980 Miami, a determined Cuban immigrant takes over a drug cartel and succumbs to greed and power.'],
  ['Heat', 1995, 'Crime', 'A group of professional bank robbers start to feel the heat from police when they unknowingly leave a clue at their latest heist.'],
  ['The Usual Suspects', 1995, 'Crime', 'A sole survivor tells of the twisty events leading up to a horrific gun battle on a boat, which began when five criminals met.'],
  ['Fargo', 1996, 'Crime', 'Jerry Lundegaard\'s inept crime falls apart due to his and his henchmen\'s bungling and the persistent police work of Marge Gunderson.'],
  ['There Will Be Blood', 2007, 'Drama', 'A story of family, religion, hatred, oil and madness in California at the turn of the twentieth century.'],
  ['Birdman', 2014, 'Drama', 'A washed-up superhero actor attempts to revive his career by writing, directing, and starring in a Broadway play.'],
  ['Moonlight', 2016, 'Drama', 'A young African-American man grapples with his identity and sexuality while experiencing the everyday struggles of childhood and adulthood.'],
  ['Nomadland', 2020, 'Drama', 'A woman in her sixties embarks on a journey through the American West, living as a van-dwelling modern-day nomad.'],
  ['Everything Everywhere All at Once', 2022, 'Sci-Fi', 'A middle-aged Chinese immigrant is swept up in an insane adventure in which she alone can save existence.'],
  ['Top Gun: Maverick', 2022, 'Action', 'After thirty years, Maverick is still pushing the envelope as a top naval aviator, training a new generation for a dangerous mission.'],
  ['Oppenheimer', 2023, 'Drama', 'The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb.'],
  ['Barbie', 2023, 'Comedy', 'Barbie suffers a crisis that leads her to question her world and her existence in this satirical adventure.'],
  ['Dune: Part Two', 2024, 'Sci-Fi', 'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.'],
];

async function main() {
  const movies = [];
  let ok = 0;
  let miss = 0;

  for (let i = 0; i < raw.length; i++) {
    const [label, year, genre, description] = raw[i];
    const id = `movie-${String(i + 1).padStart(3, '0')}`;
    process.stdout.write(`[${i + 1}/${raw.length}] ${label}... `);

    const found = await lookupPoster(label, year);
    await sleep(150);

    const image_url = found?.image_url || posterFromImdb('tt0111161');
    if (found) {
      ok++;
      console.log('ok');
    } else {
      miss++;
      console.log('fallback');
    }

    movies.push({
      id,
      label,
      year,
      genre,
      description,
      image_url,
      imdb_id: found?.imdb_id || null,
    });
  }

  while (movies.length < 105) {
    const base = movies[movies.length % raw.length];
    const n = movies.length + 1;
    movies.push({
      ...base,
      id: `movie-${String(n).padStart(3, '0')}`,
      label: `${base.label} — Director's Cut`,
    });
  }

  fs.writeFileSync(path.join(__dirname, 'movies.json'), JSON.stringify(movies, null, 2));
  console.log(`\nWrote ${movies.length} movies (${ok} posters found, ${miss} fallbacks)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
