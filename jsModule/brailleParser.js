const brailleToLetter = 
{
    "⠁": "a", "⠃": "b", "⠉": "c", "⠙": "d", "⠑": "e",
    "⠋": "f", "⠛": "g", "⠓": "h", "⠊": "i", "⠚": "j",
    "⠅": "k", "⠇": "l", "⠍": "m", "⠝": "n", "⠕": "o",
    "⠏": "p", "⠟": "q", "⠗": "r", "⠎": "s", "⠞": "t",
    "⠥": "u", "⠧": "v", "⠺": "w", "⠭": "x", "⠽": "y", "⠵": "z"
};

const brailleToDigit = 
{
    "⠁": "1", "⠃": "2", "⠉": "3", "⠙": "4", "⠑": "5",
    "⠋": "6", "⠛": "7", "⠓": "8", "⠊": "9", "⠚": "0"
};

const punctuationToBraille = 
{
    ".": "⠲", ",": "⠂", "!": "⠖", "?": "⠦", ":": "⠒",
    ";": "⠆", "'": "⠄", "\"": "⠶", "-": "⠤", "(": "⠐⠣", ")": "⠐⠜"
};

const brailleToPunctuation = Object.fromEntries (Object.entries(punctuationToBraille).map(([k, v]) => [v, k]));

const letterToBraille = Object.fromEntries(Object.entries(brailleToLetter).map(([k, v]) => [v, k]));
const digitToBraille = Object.fromEntries(Object.entries(brailleToDigit).map(([k, v]) => [v, k]));

const NUMBER_TOGGLE = "⠼";
const UPPERCASE = "⠠";
const ALLCAPS = "⠠⠠";

export function brailleToText(input) 
{
    let result = "";
    let numberMode = false;
    let upperMode = false;
    let allCapsMode = false;
    let i = 0;

    while (i < input.length)
    {
        let ch = input[i];

        if (input.slice(i, i + 2) === ALLCAPS) 
        {
            allCapsMode = true;
            i += 2;
            continue;
        }

        if (ch === NUMBER_TOGGLE)
        {
            numberMode = true;
            i++;
            continue;
        }

        if (ch === UPPERCASE)
        {
            upperMode = true;
            i++;
            continue;
        }

        if (numberMode)
        {
            if (ch in brailleToDigit)
            {
                result += brailleToDigit[ch];
                i++;
                continue;
            }
            else
            {
                numberMode = false;
            }
        }

        if (ch in brailleToLetter)
        {
            const letter = brailleToLetter[ch];
            result += (upperMode || allCapsMode) ? letter.toUpperCase() : letter;
        }
        else if (ch in brailleToPunctuation)
        {
            result += brailleToPunctuation[ch];
        }
        else
        {
            result += "?";
        }

        upperMode = false;
        i++;
    }

    return result;
}

export function textToBraille(input)
{
    let result = "";
    let inNumberMode = false;

    for (let i = 0; i < input.length; i++)
    {
        let ch = input[i];

        if (/\d/.test(ch))
        {
            if (!inNumberMode)
            {
                result += NUMBER_TOGGLE;
                inNumberMode = true;
            }

            result += digitToBraille[ch] ?? "?";
        }
        else
        {
            if (inNumberMode)
            {
                result += NUMBER_TOGGLE;
                inNumberMode = false;
            }

            if (/[a-zA-Z]/.test(ch))
            {
                if (ch === ch.toUpperCase()) result += UPPERCASE;
                result += letterToBraille[ch.toLowerCase()] ?? "?";
            }
            else if (ch in punctuationToBraille)
            {
                result += punctuationToBraille[ch];
            }
            else
            {
                result += ch;
            }
        }
    }

    if (inNumberMode)
    {
        result += NUMBER_TOGGLE;
    }

    return result;
}