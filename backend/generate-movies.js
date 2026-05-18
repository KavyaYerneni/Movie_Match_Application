/** One-time generator for movies.json — run: node generate-movies.js */
const fs = require('fs');
const path = require('path');

/** Poster images: placehold.co placeholders (no broken images in demo). */
function posterUrl(title, index) {
  const colors = ['16213e', '0f3460', '533483', '1a1a2e', '2d4059'];
  const accent = ['e94560', 'f5a623', '4ecca3', '00adb5', 'ff6b6b'];
  const bg = colors[index % colors.length];
  const fg = accent[index % accent.length];
  const text = encodeURIComponent(title.slice(0, 22));
  return `https://placehold.co/400x600/${bg}/${fg}/png?font=source-sans-pro&text=${text}`;
}

const raw = [
  ['The Shawshank Redemption', 'Two imprisoned men bond over years, finding solace and redemption.'],
  ['The Godfather', 'The aging patriarch of an organized crime dynasty transfers control to his reluctant son.'],
  ['The Dark Knight', 'Batman faces the Joker, a criminal mastermind who plunges Gotham into chaos.'],
  ['Pulp Fiction', 'The lives of two mob hitmen, a boxer, and others intertwine in Los Angeles.'],
  ['Forrest Gump', 'The presidencies of Kennedy and Johnson unfold through the perspective of an Alabama man.'],
  ['Inception', 'A thief who steals corporate secrets through dream-sharing is offered a chance at redemption.'],
  ['Fight Club', 'An insomniac office worker and a soap maker form an underground fight club.'],
  ['The Matrix', 'A computer hacker learns about the true nature of reality from mysterious rebels.'],
  ['Goodfellas', 'The story of Henry Hill and his life in the mob from 1955 to 1980.'],
  ['The Silence of the Lambs', 'A young FBI cadet must receive help from an incarcerated cannibal killer.'],
  ['Interstellar', 'A team of explorers travel through a wormhole in space to ensure humanity survival.'],
  ['Parasite', 'Greed and class discrimination threaten the newly formed symbiotic relationship of two families.'],
  ['Spirited Away', 'During her family move to the suburbs, a sullen 10-year-old wanders into a world ruled by gods.'],
  ['The Lord of the Rings: The Return of the King', 'Gandalf and Aragorn lead the World of Men against Sauron to draw his gaze from Frodo.'],
  ['Schindler\'s List', 'In German-occupied Poland, industrialist Oskar Schindler gradually becomes concerned for his Jewish workers.'],
  ['12 Angry Men', 'A jury holdout attempts to prevent a miscarriage of justice by forcing his colleagues to reconsider.'],
  ['The Green Mile', 'The lives of guards on Death Row are affected by one of their charges: a black man accused of murder.'],
  ['Gladiator', 'A former Roman General sets out to exact vengeance against the corrupt emperor who murdered his family.'],
  ['The Prestige', 'After a tragic accident, two stage magicians engage in a battle to create the ultimate illusion.'],
  ['The Departed', 'An undercover cop and a mole in the police attempt to identify each other.'],
  ['Whiplash', 'A promising young drummer enrolls at a cut-throat music conservatory.'],
  ['The Lion King', 'Lion prince Simba and his father are targeted by his bitter uncle Scar.'],
  ['Back to the Future', 'Marty McFly is sent back to 1955 in a DeLorean invented by his friend Doc Brown.'],
  ['Terminator 2: Judgment Day', 'A cyborg, identical to the one who failed to kill Sarah Connor, must protect her ten-year-old son.'],
  ['Alien', 'The crew of a commercial spacecraft encounter a deadly lifeform after investigating a transmission.'],
  ['Blade Runner 2049', 'Young Blade Runner K unearths a long-buried secret that leads him to track down former Blade Runner Rick Deckard.'],
  ['Mad Max: Fury Road', 'In a post-apocalyptic wasteland, Max teams up with a mysterious woman to escape a tyrannical warlord.'],
  ['Jurassic Park', 'A pragmatic paleontologist touring an almost complete theme park on an island in Central America.'],
  ['E.T. the Extra-Terrestrial', 'A troubled child summons the courage to help a friendly alien escape Earth.'],
  ['Toy Story', 'A cowboy doll is profoundly threatened when a new spaceman figure supplants him as top toy.'],
  ['Finding Nemo', 'After his son is captured in the Great Barrier Reef, a timid clownfish sets out on a journey.'],
  ['Up', '78-year-old Carl Fredricksen travels to Paradise Falls in his house equipped with balloons.'],
  ['WALL-E', 'In the distant future, a small waste-collecting robot inadvertently embarks on a space journey.'],
  ['Coco', 'Aspiring musician Miguel confronts his family\'s ancestral ban on music in the Land of the Dead.'],
  ['Inside Out', 'After young Riley is uprooted, her emotions conflict on how best to navigate a new city.'],
  ['Ratatouille', 'A rat who can cook makes an unusual alliance with a young kitchen worker at a famous restaurant.'],
  ['The Incredibles', 'A family of undercover superheroes, while trying to live the quiet suburban life, are forced into action.'],
  ['Monsters, Inc.', 'Monsters generate their city\'s power by scaring children, but they are terribly afraid themselves.'],
  ['Shrek', 'A mean lord exiles fairytale creatures to the swamp of a grumpy ogre, who must go rescue a princess.'],
  ['How to Train Your Dragon', 'A hapless young Viking who aspires to hunt dragons becomes the unlikely friend of a young dragon.'],
  ['Frozen', 'When the newly crowned Queen Elsa accidentally uses her power to turn things into ice.'],
  ['Moana', 'In Ancient Polynesia, a terrible curse incurred by the Demigod Maui reaches an impetuous Chieftain\'s daughter.'],
  ['Zootopia', 'In a city of anthropomorphic animals, a rookie bunny cop and a cynical con artist fox must work together.'],
  ['Big Hero 6', 'A special bond develops between plus-sized inflatable robot Baymax and prodigy Hiro Hamada.'],
  ['La La Land', 'While navigating their careers in Los Angeles, a pianist and an actress fall in love.'],
  ['Whisper of the Heart', 'A love story between a girl who loves reading books and a boy who has previously checked out all library books.'],
  ['Your Name', 'Two strangers find themselves linked in a bizarre way when a connection forms between them.'],
  ['Akira', 'A secret military project endangers Neo-Tokyo when it turns a biker gang member into a rampaging psychic.'],
  ['Ghost in the Shell', 'A cyborg policewoman and her partner hunt a mysterious and powerful hacker called the Puppet Master.'],
  ['Princess Mononoke', 'On a journey to find the cure for a Tatarigami curse, Ashitaka finds himself in the middle of a war.'],
  ['Howl\'s Moving Castle', 'When an unconfident young woman is cursed with an old body by a spiteful witch, her only chance is a wizard.'],
  ['My Neighbor Totoro', 'When two girls move to the country to be near their ailing mother, they have adventures with forest spirits.'],
  ['Grave of the Fireflies', 'A young boy and his little sister struggle to survive in Japan during World War II.'],
  ['Se7en', 'Two detectives hunt a serial killer who uses the seven deadly sins as his motives.'],
  ['The Usual Suspects', 'A sole survivor tells of the twisty events leading up to a horrific gun battle on a boat.'],
  ['Memento', 'A man with short-term memory loss attempts to track down his wife\'s murderer.'],
  ['Requiem for a Dream', 'The drug-induced utopias of four Coney Island people are shattered when their addictions run deep.'],
  ['American History X', 'A former neo-nazi skinhead tries to prevent his younger brother from going down the same wrong path.'],
  ['The Pianist', 'A Polish Jewish musician struggles to survive the destruction of the Warsaw ghetto of World War II.'],
  ['Life Is Beautiful', 'When an open-minded Jewish librarian and his son become victims of the Holocaust, he uses imagination.'],
  ['Cinema Paradiso', 'A filmmaker recalls his childhood when falling in love with the pictures at the cinema of his home village.'],
  ['Amélie', 'Amélie is an innocent and naive girl in Paris with her own sense of justice.'],
  ['Pan\'s Labyrinth', 'In the Falangist Spain of 1944, the bookish young stepdaughter of a sadistic army officer escapes into fantasy.'],
  ['Oldboy', 'After being kidnapped and imprisoned for fifteen years, Oh Dae-Su is released, only to find he must find his captor.'],
  ['Memories of Murder', 'In a small Korean province in 1986, two detectives struggle with the case of multiple young women being found raped and murdered.'],
  ['The Handmaiden', 'A woman is hired as a handmaiden to a Japanese heiress, but secretly she is involved in a plot to defraud her.'],
  ['Shoplifters', 'A family of small-time crooks take in a child they find outside in the cold.'],
  ['Roma', 'A year in the life of a middle-class family\'s maid in Mexico City in the early 1970s.'],
  ['Moonlight', 'A young African-American man grapples with his identity and sexuality while experiencing the everyday struggles.'],
  ['Get Out', 'A young African-American visits his white girlfriend\'s parents for the weekend, where his simmering uneasiness reaches a boiling point.'],
  ['Black Panther', 'T\'Challa, heir to the hidden but advanced kingdom of Wakanda, must step forward to lead his people.'],
  ['Spider-Man: Into the Spider-Verse', 'Teen Miles Morales becomes the Spider-Man of his universe and must team with five counterparts.'],
  ['Avengers: Endgame', 'After the devastating events of Infinity War, the universe is in ruins.'],
  ['Iron Man', 'After being held captive in an Afghan cave, billionaire engineer Tony Stark creates a unique weaponized suit.'],
  ['Guardians of the Galaxy', 'A group of intergalactic criminals must pull together to stop a fanatical warrior from taking control of the universe.'],
  ['Doctor Strange', 'While on a journey of physical and spiritual healing, a brilliant neurosurgeon is drawn into the world of the mystic arts.'],
  ['Thor: Ragnarok', 'Imprisoned on the planet Sakaar, Thor must race against time to return to Asgard and stop Ragnarök.'],
  ['Captain America: The Winter Soldier', 'As Steve Rogers struggles to embrace his role in the modern world, he teams with Black Widow.'],
  ['Logan', 'In a future where mutants are nearly extinct, an elderly and weary Logan leads a quiet life.'],
  ['Deadpool', 'A wisecracking mercenary gets experimented on and becomes immortal but ugly, and sets out to track down the man who ruined his looks.'],
  ['X-Men: Days of Future Past', 'The X-Men send Wolverine to the past in a desperate effort to change history and prevent an event.'],
  ['The Social Network', 'As Harvard student Mark Zuckerberg creates the social networking site that would become Facebook.'],
  ['The Big Short', 'In 2006-2007 a group of investors bet against the US mortgage market.'],
  ['Moneyball', 'Oakland A\'s general manager Billy Beane\'s successful attempt to assemble a baseball team on a lean budget.'],
  ['The Wolf of Wall Street', 'Based on the true story of Jordan Belfort, from his rise to a wealthy stock-broker to his fall involving crime.'],
  ['There Will Be Blood', 'A story of family, religion, hatred, oil and madness, focusing on a turn-of-the-century prospector.'],
  ['No Country for Old Men', 'Violence and mayhem ensue after a hunter stumbles upon a drug deal gone wrong and more than two million dollars.'],
  ['Fargo', 'Jerry works in his father-in-law\'s car dealership and has gotten himself in financial problems.'],
  ['The Big Lebowski', 'Jeff "The Dude" Lebowski, mistaken for a millionaire, seeks restitution for his ruined rug.'],
  ['O Brother, Where Art Thou?', 'In the deep south during the 1930s, three escaped convicts search for hidden treasure.'],
  ['Burn After Reading', 'A disk containing mysterious information from a CIA agent ends up in the hands of two unscrupulous gym employees.'],
  ['True Grit', 'A stubborn teenager enlists the help of a tough U.S. Marshal to track down her father\'s murderer.'],
  ['Django Unchained', 'With the help of a German bounty hunter, a freed slave sets out to rescue his wife from a brutal plantation owner.'],
  ['Inglourious Basterds', 'In Nazi-occupied France during World War II, a plan to assassinate Nazi leaders by a group of Jewish U.S. soldiers.'],
  ['Kill Bill: Vol. 1', 'After awakening from a four-year coma, a former assassin wreaks vengeance on the team of assassins who betrayed her.'],
  ['Reservoir Dogs', 'When a simple jewelry heist goes horribly wrong, the surviving criminals begin to suspect that one of them is a police informant.'],
  ['Jackie Brown', 'A flight attendant with a criminal past gets nabbed by the FBI for smuggling.'],
  ['Sin City', 'An exploration of the dark and miserable Basin City and three of its residents.'],
  ['300', 'King Leonidas of Sparta and a force of 300 men fight the Persians at Thermopylae in 480 B.C.'],
  ['Watchmen', 'In 1985 where former superheroes exist, the murder of a colleague sends active vigilante Rorschach into his own investigation.'],
  ['V for Vendetta', 'In a future British dystopian society, a shadowy freedom fighter plots to overthrow the tyrannical government.'],
  ['Children of Men', 'In 2027, in a chaotic world in which women have become somehow infertile, a former activist agrees to help transport a miraculously pregnant woman.'],
  ['District 9', 'Violence ensues after an extraterrestrial race forced to live in slum-like conditions on Earth finds a kindred spirit in a government agent.'],
  ['Arrival', 'A linguist works with the military to communicate with alien lifeforms after twelve mysterious spacecraft appear around the world.'],
  ['Blade Runner', 'A blade runner must pursue and terminate four replicants who stole a ship in space and have returned to Earth.'],
  ['Dune', 'Feature adaptation of Frank Herbert\'s science fiction novel about the son of a noble family entrusted with the protection of the most valuable asset in the galaxy.'],
  ['The Martian', 'An astronaut becomes stranded on Mars after his team assume him dead, and must rely on his ingenuity to find a way to signal to Earth.'],
  ['Gravity', 'Two astronauts work together to survive after an accident leaves them stranded in space.'],
  ['First Man', 'A look at the life of the astronaut, Neil Armstrong, and the legendary space mission that led him to become the first man to walk on the Moon.'],
  ['Hidden Figures', 'The story of a team of female African-American mathematicians who served a vital role in NASA during the early years of the U.S. space program.'],
  ['The Imitation Game', 'During World War II, the English mathematical genius Alan Turing tries to crack the German Enigma code.'],
  ['A Beautiful Mind', 'After John Nash, a brilliant but asocial mathematician, accepts secret work in cryptography, his life takes a turn for the nightmarish.'],
  ['The Theory of Everything', 'A look at the relationship between the famous physicist Stephen Hawking and his wife.'],
  ['Spotlight', 'The true story of how the Boston Globe uncovered the massive scandal of child molestation and cover-up within the local Catholic Archdiocese.'],
  ['Milk', 'The story of Harvey Milk and his struggles as an American gay activist who fought for gay rights.'],
  ['Dallas Buyers Club', 'In 1985 Dallas, electrician and hustler Ron Woodroof works around the system to help AIDS patients get the medication they need.'],
  ['The Revenant', 'A frontiersman on a fur trading expedition in the 1820s fights for survival after being mauled by a bear.'],
  ['Birdman', 'A washed-up superhero actor attempts to revive his career by writing, directing, and starring in a Broadway production.'],
  ['The Grand Budapest Hotel', 'A writer encounters the owner of an aging high-class hotel, who tells him of his early years serving as a lobby boy.'],
  ['Fantastic Mr. Fox', 'An urbane fox cannot resist returning to his farm raiding ways and then must help his community survive the farmers\' retaliation.'],
  ['Isle of Dogs', 'Set in Japan, Isle of Dogs follows a boy\'s odyssey in search of his lost dog.'],
  ['Moonrise Kingdom', 'A pair of young lovers flee their New England town, causing a local search party to fan out to find them.'],
  ['Rushmore', 'The extracurricular king of Rushmore preparatory school is put on academic probation.'],
  ['The Royal Tenenbaums', 'The eccentric members of a dysfunctional family reluctantly gather under the same roof for various reasons.'],
];

// Pad with generated entries if needed and fix poster URLs to use placehold.co fallback pattern
const movies = raw.map(([label, description], i) => {
  const id = `movie-${String(i + 1).padStart(3, '0')}`;
  return { id, label, description, image_url: posterUrl(label, i) };
});

// Ensure 105+ by duplicating variants with unique ids if under 100
while (movies.length < 105) {
  const base = movies[movies.length % raw.length];
  movies.push({
    ...base,
    id: `movie-${String(movies.length + 1).padStart(3, '0')}`,
    label: `${base.label} (Alt Cut)`,
  });
}

fs.writeFileSync(path.join(__dirname, 'movies.json'), JSON.stringify(movies, null, 2));
console.log(`Wrote ${movies.length} movies to movies.json`);
