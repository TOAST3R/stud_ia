# english-audio Specification

## Purpose

Speaks English words and sentences aloud so children can practise pronunciation and vocabulary by listening. This is separate from the Spanish voice that reads instructions.

## Requirements

### Requirement: English voice
English audio SHALL be spoken with an English voice, preferring British English and falling back to any other English voice. It MUST be a little slower than normal speech. It MUST NOT use the Spanish voice.

#### Scenario: Device with a British voice
- **WHEN** the device has an `en-GB` voice and a question plays the word "sheep"
- **THEN** "sheep" is spoken with the `en-GB` voice

#### Scenario: Device with only an American voice
- **WHEN** the device has no `en-GB` voice but has an `en-US` voice
- **THEN** English audio uses the `en-US` voice

### Requirement: Listening questions play their audio
A question that has English audio SHALL play it when it appears. If the Spanish instruction is also read aloud, the English audio MUST come after it, not interrupt it.

#### Scenario: Young player
- **WHEN** an Infantil question "Escucha y toca el dibujo" appears with the word "dog"
- **THEN** the Spanish instruction is spoken first and then "dog" in English

#### Scenario: Older player
- **WHEN** a 3.º–4.º listening question appears
- **THEN** its English audio plays once without a Spanish reading first

### Requirement: Replay English audio
Every question with English audio SHALL show a clearly visible "listen" button that plays the English audio again, as often as the player wants, without counting as an attempt.

#### Scenario: Listening again
- **WHEN** the player taps the listen button three times before answering
- **THEN** the English audio plays three times and the question's attempts and stars are unchanged

### Requirement: Listening works with sound turned off
English audio of a question SHALL play even when the player has turned sound off. With sound off, effects and the Spanish reading of instructions MUST stay silent.

#### Scenario: Sound switched off
- **WHEN** sound is off and a listening question appears
- **THEN** no sound effects or Spanish reading play, and the English word still plays, automatically and on the listen button

### Requirement: No English voice available
When the device cannot speak English, a listening question SHALL remain answerable. It MUST show the English text it would have spoken and a short notice that the device has no English voice.

#### Scenario: Browser without speech synthesis
- **WHEN** the browser has no speech synthesis or no English voice and a question would play "ship"
- **THEN** the word "ship" is shown on screen with a notice, and the player can answer normally

### Requirement: No microphone or speech recognition
The English subject MUST NOT ask for microphone access, record audio or send the player's voice anywhere.

#### Scenario: Playing every level
- **WHEN** a player plays any Inglés mission or exam
- **THEN** the browser never asks for microphone permission
