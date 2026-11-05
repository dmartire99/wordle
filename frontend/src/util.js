export const LetterStatus = Object.freeze({
    NOT_IN_WORD: 0,
    CORRECT: 1,
    IN_WORD: 2,
    UNDEFINED: 3
})


export const letterStyle = (status) => {
    if (status === LetterStatus.CORRECT) {
        return 'correct'
    }
    if (status === LetterStatus.IN_WORD) {
        return 'inword'
    }
    if (status === LetterStatus.NOT_IN_WORD) {
        return 'notinword'
    }
    return ''
}

