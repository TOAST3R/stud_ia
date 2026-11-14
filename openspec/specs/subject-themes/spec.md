# subject-themes Specification

## Purpose

Lets each subject choose the visual world it is played in (map, exam node, backdrop, wording and travel mini-game), so a subject can have its own identity without changing how the others look.

## Requirements

### Requirement: Subjects declare a theme
Every subject SHALL be shown in exactly one theme. A subject that does not declare a theme MUST use the `space` theme.

#### Scenario: Subject without a theme
- **WHEN** the player opens Matemáticas, Lógica, Geometría or the Zona de juegos
- **THEN** the map, exam node, backdrop, wording and travel mini-game look and behave exactly as before this change

#### Scenario: Subject with the ocean theme
- **WHEN** the player opens Inglés
- **THEN** every screen of that subject (map, unit sheet, travel, questions, results) uses the `ocean` theme

### Requirement: Theme backdrop follows the screen
The page backdrop SHALL match the theme of the subject on screen. Screens that belong to no subject (players, home, progress) MUST show the `space` backdrop.

#### Scenario: Entering and leaving an ocean subject
- **WHEN** the player opens Inglés and then returns to the home screen
- **THEN** the backdrop shows bubbles and underwater light while in Inglés, and the starfield again on the home screen

### Requirement: Ocean map shows islands
In the `ocean` theme, each unit on the map SHALL appear as an island. Islands MUST show the same four states as planets (locked, not started, in progress, finished), each with a face and the unit emoji, and the player's avatar on the current island.

#### Scenario: Island states
- **WHEN** a level has one finished unit, one started unit, one unstarted open unit and one locked unit
- **THEN** the map shows a finished island face, a playing face, a sleepy face and a padlocked greyed-out island

### Requirement: Ocean exam node is a shipwreck
In the `ocean` theme, a level's exam SHALL appear on the map as a shipwreck instead of a black hole. It keeps the same lock rules, title, number of questions and grade display.

#### Scenario: Exam still locked
- **WHEN** not every island of the level is finished and the level is not open by school year rules
- **THEN** the shipwreck appears locked with the message telling the player to complete the islands

### Requirement: Theme wording
User-visible text that names units SHALL use the theme's word: "planeta/planetas" in `space`, "isla/islas" in `ocean`. This covers lock messages, exam lock labels, the travel title and the progress screen.

#### Scenario: Lock message in ocean
- **WHEN** the player taps a locked island in Inglés
- **THEN** the message says to complete the previous island first, naming it, and does not mention planets

#### Scenario: Progress screen next step
- **WHEN** the progress screen shows the next unit to play in Inglés
- **THEN** it reads "Siguiente isla" with that island's name

### Requirement: Ocean travel mini-game is a submarine
In the `ocean` theme, the travel mini-game between missions SHALL show the player's avatar in a submarine moving underwater. Tapping or pressing space makes it rise and it sinks gently otherwise. It MUST keep the existing duration, skip button, collectibles that award crystals and the no-game-over rule.

#### Scenario: Swimming to the next island
- **WHEN** the player finishes a mission in Inglés and the next one is on another island
- **THEN** the travel screen reads "Rumbo a <island>" and plays the submarine mini-game, and collected treasure adds crystals

#### Scenario: Bumping into an obstacle
- **WHEN** the submarine touches a jellyfish or a sea mine
- **THEN** the run continues; the player loses at most one crystal, and nothing for young players
