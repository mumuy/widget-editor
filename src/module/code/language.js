export const languages = [
    ['text','纯文本'],['html','HTML'],['javascript','JavaScript'],['css','CSS'],['java','Java'],
    ['typescript','TypeScript'],['php','PHP'],['python','Python'],['go','Go'],['json','JSON'],['sql','SQL'],['bash','Bash']
];

const aliases = {js:'javascript',ts:'typescript',xml:'html',py:'python',golang:'go',sh:'bash',shell:'bash',plaintext:'text',txt:'text'};

export function languageName(value){
    value = String(value||'text').trim().toLowerCase();
    value = aliases[value]||value;
    return languages.some(item=>item[0]===value)?value:'text';
}

const keywords = {
    javascript:'as async await break case catch class const continue debugger default delete do else export extends false finally for from function get if import in instanceof let new null of return set static super switch this throw true try typeof undefined var void while with yield',
    typescript:'abstract any as asserts async await boolean break case catch class const constructor continue declare default delete do else enum export extends false finally for from function get if implements import in infer instanceof interface is keyof let module namespace never new null number object of override private protected public readonly require return satisfies set static string super switch symbol this throw true try type typeof undefined unique unknown var void while with yield',
    java:'abstract assert boolean break byte case catch char class const continue default do double else enum exports extends false final finally float for if implements import instanceof int interface long module native new null package permits private protected public record requires return sealed short static strictfp super switch synchronized this throw throws transient true try var void volatile while yield String Object Integer Boolean Double Float System',
    php:'abstract and array as bool break callable case catch class clone const continue declare default die do echo else elseif empty enddeclare endfor endforeach endif endswitch endwhile enum eval exit extends false final finally float fn for foreach function global goto if implements include include_once instanceof insteadof int interface isset list match namespace new null or parent print private protected public readonly require require_once return self static string switch throw trait true try unset use var void while xor yield',
    python:'and as assert async await break class continue def del elif else except False finally for from global if import in is lambda None nonlocal not or pass raise return True try while with yield',
    go:'break case chan const continue default defer else fallthrough for func go goto if import interface map package range return select struct switch type var true false nil bool byte complex64 complex128 error float32 float64 int int8 int16 int32 int64 rune string uint uint8 uint16 uint32 uint64 uintptr',
    json:'true false null',
    sql:'add all alter and any as asc between by case check column constraint create cross database default delete desc distinct drop else end except exists false foreign from full group having if in index inner insert intersect into is join key left like limit not null offset on or order outer primary references right select set table then true union unique update values view when where with',
    bash:'if then else elif fi for while until do done case esac in function select time coproc break continue return exit export readonly local declare typeset unset shift source'
};

export const profiles = Object.fromEntries(Object.entries(keywords).map(([name,words])=>[name,new Set(words.split(' '))]));
