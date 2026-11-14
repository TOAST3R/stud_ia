# english-subject Specification

## Purpose

The Inglés subject teaches English vocabulary and pronunciation from Infantil to 6.º de Primaria through listening and picture games, organised in four levels of islands with an exam each.

## Requirements

### Requirement: Inglés subject for every school year
The app SHALL offer a subject called "Inglés" for every school year from Infantil 3 to 6.º. It MUST use the `ocean` theme and appear on the home screen with its stars progress like the other subjects.

#### Scenario: A 4.º player on the home screen
- **WHEN** a player in 4.º opens the home screen
- **THEN** Inglés appears among their subjects with its tagline and star count

### Requirement: Four levels with exams
Inglés SHALL have four levels: Infantil, 1.º y 2.º, 3.º y 4.º, 5.º y 6.º. Each level is a sea of islands with one exam of 10 questions drawn from that level's islands. Levels open by the same rules as Lógica and Geometría.

#### Scenario: Levels open by school year
- **WHEN** a player in 3.º opens Inglés for the first time
- **THEN** the Infantil, 1.º y 2.º and 3.º y 4.º levels are open, the 3.º y 4.º level is unfolded, and 5.º y 6.º is locked

#### Scenario: Higher level unlocked by exam
- **WHEN** that player passes the 3.º y 4.º exam with 5 or more
- **THEN** the 5.º y 6.º level opens

#### Scenario: Islands open in order
- **WHEN** a level is open
- **THEN** its first island is open, each next island opens when every mission of the previous one has at least one star, and the exam opens when every island is done

### Requirement: Infantil level is young
The Infantil level SHALL use young mode: instructions read aloud in Spanish, big pictures, no reading of English required. The other levels MUST NOT use young mode.

#### Scenario: Infantil question
- **WHEN** a player answers an Infantil Inglés question
- **THEN** the instruction is read aloud in Spanish and the answers are pictures, not English words

### Requirement: Vocabulary islands
Each level SHALL include vocabulary islands for themes suited to that age. At least: Infantil (colours, numbers, animals, fruit, toys); 1.º–2.º (body, clothes, food, classroom, pets and farm); 3.º–4.º (house, weather and seasons, days and months, daily routines, jobs); 5.º–6.º (town, hobbies and sports, feelings, actions in the past).

#### Scenario: Vocabulary island content
- **WHEN** the player opens a vocabulary island
- **THEN** every question uses words from that island's theme, and every word has a picture or emoji; words without a clear picture (days and months) are chosen as written words after listening, or put in order

### Requirement: Vocabulary exercises by level
Vocabulary islands SHALL offer exercises that grow with the level. Every level has "listen and tap the picture". From 1.º–2.º they add "see the picture and tap the English word". From 3.º–4.º they add "spell the word by putting its letters in order". Infantil and 1.º–2.º also have memory pairs whose cards say their English word when turned: picture with picture in Infantil (no reading), word with picture in 1.º–2.º.

#### Scenario: Listen and tap the picture
- **WHEN** a "listen and tap" question appears
- **THEN** the English word is played but not written, and the player chooses among pictures; exactly one is right

#### Scenario: Spell the word
- **WHEN** a spelling question shows a picture of an apple and the shuffled letters of "apple"
- **THEN** tapping the letters in the order a-p-p-l-e is correct, whichever "p" is tapped first

#### Scenario: Infantil memory
- **WHEN** an Infantil player turns a card in a memory game
- **THEN** the card shows a picture (never a written word) and its English word is spoken

### Requirement: Pronunciation islands
Each level SHALL include pronunciation islands in which the player answers by listening. At least: Infantil (words that start with the same sound); 1.º–2.º (short words such as cat/cot/cut, rhymes); 3.º–4.º (minimal pairs such as ship/sheep and hat/hut, silent letters); 5.º–6.º (the three sounds of -ed, word stress, "th" against s, f and t, homophones).

#### Scenario: Minimal pair
- **WHEN** a minimal-pair question plays "sheep"
- **THEN** the options include "sheep" and "ship" (written, with pictures when they exist), and only "sheep" is right

#### Scenario: Same first sound
- **WHEN** an Infantil question plays "cat" and asks which picture starts with the same sound
- **THEN** the options are pictures; "cat" and then each picture's word are played in turn while that picture lights up, and exactly one starts with the same sound as "cat"

#### Scenario: -ed endings
- **WHEN** a question plays "wanted" and asks how its ending sounds
- **THEN** the options are the three endings /t/, /d/ and /ɪd/, and /ɪd/ is right

#### Scenario: Word stress
- **WHEN** a question plays "banana" and asks which part is strongest
- **THEN** the options are the word split into syllables with one syllable highlighted each, and "ba-NA-na" is right

### Requirement: Feedback explains the sound
After every Inglés answer, the feedback SHALL show the right English word, play it again, and say in Spanish what it means or what sound to notice.

#### Scenario: Wrong minimal pair
- **WHEN** the player chooses "ship" for the audio "sheep"
- **THEN** the feedback shows "sheep 🐑 = oveja", plays "sheep", and explains that "ee" is long and "i" is short

### Requirement: Varied questions
Each Inglés mission SHALL generate its questions at random from its word list, so replaying it gives different questions. Wrong options MUST belong to the same level and never repeat the right answer.

#### Scenario: Replaying a mission
- **WHEN** the player plays the same mission twice
- **THEN** the questions or their order differ, and no question shows the right answer twice among its options
