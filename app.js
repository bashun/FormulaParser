var input = '', res = [], typeObj = { 1: 'NUM', 2: 'VAL', 3: 'OPE', 4: 'FOM' };
var exp;

function main(input) {
    var lines = input.replace(/\n$/, '').split('\n');
    if (lines.length > 2) {
        var firstLine = lines.shift();
        // 空白行を削除
        lines.shift();
        lines.forEach(function (val, idx, array) {
            //計算式を分割する
            var tagLine = splitExp(val, firstLine.concat());
            // 計算する
            console.log(evala(tagLine, 0));
        });
    }
}

// 計算式を分割する
function splitExp(line, firstLine) {
    var resObj = [], localExp = firstLine.match(/[-+*()]|[^-+*()\s]+|\s+/g);
    // 代数の置換
    localExp = lineReplace(line, localExp);
    // オブジェクト化
    localExp.forEach(function (val, idx, array) {
        if (val.match(/\d/)) {
            resObj.push({ type: typeObj[1], types: [typeObj[1]], desc: [val], sec: [''] });
        } else if (val.match(/[a-z]/)) {
            resObj.push({ type: typeObj[2], types: [typeObj[2]], desc: [1], sec: [val] });
        } else if (val.match(/[-+*()]/)) {
            resObj.push({ type: typeObj[3], types: [typeObj[3]], desc: [val], sec: [''] });
        }
    });
    return resObj;
}

// 代数の置換を行う
function lineReplace(line, exp) {
    var a = line.split(',');
    var f = a.map(function (val, idx, array) {
        return val.split('=');
    });
    for (var i = 0; i < exp.length; i++) {
        for (var j = 0; j < f.length; j++) {
            if (exp[i] == f[j][0]) {
                exp[i] = f[j][1];
            }
        }
    }
    return exp;
}

function evala(data, start) {
    // 数式をスタックに詰め込む
    var i, stack = [], opeStack = [], resObj, brancketResObj, res;
    for (i = start; i < data.length; i++) {
        // console.log('stack: ');
        // console.log(stack);
        // console.log('');
        // console.log('opeStack: ');
        // console.log(opeStack);
        // console.log('');
        // 読み込む要素によって処理を分類
        // 括弧以外の場合
        if (data[i].type === typeObj[1] || data[i].type === typeObj[2]) {
            // 数値か文字の場合
            stack.push(data[i]);
        } else if (data[i].desc[0].match(/[-+*]/)) {
            // 記号の場合
            if (stack.length === 0 && data[i].desc[0] === '-') {
                // 先頭がマイナスの場合の処理
                if (typeof data[i + 1] === 'object') {
                    if (data[i + 1].type === typeObj[1] || data[i + 1].type === typeObj[2]) {
                        data[i + 1].desc[0] = parseInt(data[i + 1].desc[0]) * -1;
                        continue;
                    }
                }
            }
            // +か-の場合、記号スタックが空じゃなかった場合は取り出してメインスタックに追加する
            if (opeStack.length !== 0) {
                if (data[i].desc[0] !== '*' || opeStack[opeStack.length - 1].desc[0] === '*') {
                    stack.push(opeStack.pop());
                }
            }
            opeStack.push(data[i]);
        } else if (data[i].desc[0] === ')') {
            // 閉じ括弧の場合は現在のスタックと現在のiをオブジェクトにして返す
            while (opeStack.length > 0) {
                stack.push(opeStack.pop());
            }
            resObj = {
                res: stack,
                i: i
            };
            return resObj;
        } else if (data[i].desc[0] === '(') {
            // 括弧がある場合は括弧内の計算結果をスタックに追加する
            brancketResObj = evala(data, i + 1);
            if (opeStack.length !== 0 && opeStack[opeStack.length - 1].desc[0] === '-') {
                brancketResObj.res.forEach(function (val) {
                    if (val.type !== typeObj[3]) {
                        val.desc[0] = parseInt(val.desc[0]) * -1;
                    }
                });
                opeStack[opeStack.length - 1].desc[0] = '+'
            }
            stack = stack.concat(brancketResObj.res);
            i = brancketResObj.i;
        } else {
            console.log('i:' + i + ' 想定外のパターン');
        }
    }
    // 記号スタックに残っている記号を取り出す。
    while (opeStack.length > 0) {
        stack.push(opeStack.pop());
    }

    // console.log(stack);
    // スタックを計算する
    res = calcStack(stack);
    // console.log(res);
    // 式を並び替える
    res = sortExp(res);
    // console.log(res);
    // 乗数を整理する
    res = sortMultip(res);
    
    // 出力する
    return resToString(res);
}

function sortExp(exp) {
    return exp.sort(function (a, b) {
        return b.sec.length - a.sec.length;
    });
}

function sortMultip(res) {
    var sec, ssec = [], secCnt, tagSec = '', resSec = '';
    for (var i = 0; i < res.length; i++) {
        if (res[i].type === typeObj[1]) continue;
        var secs = res[i].sec;
        for (var j = 0; j < secs.length; j++) {
            sec = secs[j];
            if (sec.length === 1 || sec === '') continue;
            ssec = sec.split(',');
            secCnt = 1;
            resSec = '';
            for (var k = 0; k < ssec.length; k++) {
                if (ssec[k] === '') continue;
                if (tagSec === ssec[k]) {
                    secCnt++;
                } else {
                    resSec = resSec + tagSec;
                    if (secCnt > 1) {
                        resSec = resSec + secCnt;
                        secCnt = 0;
                    }
                    tagSec = ssec[k];
                }
            }
            if (secCnt > 1) {
                tagSec = tagSec + secCnt;
                secCnt = 0;
            }
            secs[j] = resSec + tagSec;
            tagSec = '';
        }
    }
    return res;
}

// 計算結果を文字列に変換する
function resToString(res) {
    if (res[0].sec.length === 0) return '0';
    var str = '', secs = res[0].sec, descs = res[0].desc;
    for (var i = 0; i < secs.length; i++) {
        if (secs.length === 1 && secs[i] === '' && parseInt(descs[i]) === 0) return '0';
        if (secs[i] === '') {
            if (descs[i] > 0) {
                str = str.length === 0 ? descs[i] : str + '+' + descs[i];
            } else if (descs[i] < 0) {
                str = str + '-' + (parseInt(descs[i]) * -1);
            }
        } else {
            if (descs[i] > 0) {
                if (descs[i] === 1) {
                    str = str.length === 0 ? secs[i] : str + '+' + secs[i];
                } else {
                    str = str.length === 0 ? descs[i] + secs[i] : str + '+' + descs[i] + secs[i];
                }
            } else if (descs[i] < 0) {
                if (descs[i] === -1) {
                    str = str + '-' + secs[i];
                } else {
                    str = str + '-' + (parseInt(descs[i]) * -1) + secs[i];
                }
            }
        }
    }
    if(str.length === 0) return '0';
    return str;
}

// スタックを計算する
function calcStack(stack) {
    var i = 0, a, res = [], x, y;
    for (i = 0; i < stack.length; i++) {
        // console.log('res: ');
        // console.log(res);
        // console.log('');
        // console.log('stack: ');
        // console.log(stack);
        // console.log('');
        a = stack[i];
        if (a.type === typeObj[1] || a.type === typeObj[2]) {
            res.push(a);
        } else if (a.type === typeObj[3]) {
            y = res.pop();
            x = res.pop();
            if (a.desc[0] === '+') {
                res.push(plus(x, y));
            } else if (a.desc[0] === '*') {
                res.push(kakeru(x, y));
            } else if (a.desc[0] === '-') {
                res.push(minus(x, y));
            }
        }
    }
    return res;
}

// 乗数の整理
function sortRes(x) {
    var secs = x.sec, descs = x.desc, types = x.types;
    for (var i = 0; i < secs.length; i++) {
        for (var j = i + 1; j < secs.length; j++) {
            if (secs[i] === secs[j]) {
                descs[i] = parseInt(descs[i]) + parseInt(descs[j]);
                if (descs[i] === 0) {
                    types[i] = '';
                    descs[i] = '';
                    secs[i] = '';
                }
                types[j] = '';
                descs[j] = '';
                secs[j] = '';
            }
        }
    }
}

// 項の並び替え
function sortObj(x) {
    var res = [], newx = { types: [], desc: [], sec: [] };
    for (var i = 0; i < x.desc.length; i++) {
        if (x.types[i] === '') continue;
        if (parseInt(x.desc[i]) === 0 && x.sec[i] === '') continue;
        res.push({
            types: x.types[i],
            desc: x.desc[i],
            sec: x.sec[i]
        });
    }
    res = res.sort(function (a, b) {
        return b.sec.length - a.sec.length;
    });
    for (var i = 0; i < res.length; i++) {
        newx.types[i] = res[i].types;
        newx.desc[i] = res[i].desc;
        newx.sec[i] = res[i].sec;
    }
    return newx;

}

// type判定処理
function checkType(a) {
    if (a.types.length === 1) {
        if (a.sec[0] === '') {
            return typeObj[1];
        } else {
            return typeObj[2];
        }
    } else {
        return typeObj[4];
    }

}

// ＋の場合
function plus(a, b) {
    var res = {};
    if (a.type === typeObj[1] && b.type === typeObj[1]) {
        res = {
            type: typeObj[1],
            types: [typeObj[1]],
            desc: [parseInt(a.desc) + parseInt(b.desc)],
            sec: ['']
        };
    } else {
        res.types = a.types.concat(b.types);
        res.desc = a.desc.concat(b.desc);
        res.sec = a.sec.concat(b.sec);
        var types = res.types, secs = res.sec, descs = res.desc;
        for (var i = 0; i < secs.length; i++) {
            for (var j = i + 1; j < secs.length; j++) {
                if (secs[i] === secs[j] && types[i] === types[j] && types !== '') {
                    descs[i] = parseInt(descs[i]) + parseInt(descs[j]);
                    if (descs[i] === 0) {
                        types[i] = '';
                        descs[i] = '';
                        secs[i] = '';
                    }
                    types[j] = '';
                    descs[j] = '';
                    secs[j] = '';
                }
            }
        }
        // 式の並び替え
        res = sortObj(res);
        // type判定
        res.type = checkType(res);
    }
    return res;
}

// ーの場合
function minus(a, b) {
    var res = {};
    if (a.type === typeObj[1] && b.type === typeObj[1]) {
        res = {
            type: typeObj[1],
            types: [typeObj[1]],
            desc: [parseInt(a.desc) - parseInt(b.desc)],
            sec: ['']
        };
    } else {
        // 数値部分に-1を付与
        for (var descCnt = 0; descCnt < b.desc.length; descCnt++) {
            b.desc[descCnt] = parseInt(b.desc[descCnt]) * -1;
        }
        res.types = a.types.concat(b.types);
        res.desc = a.desc.concat(b.desc);
        res.sec = a.sec.concat(b.sec);
        var types = res.types, secs = res.sec, descs = res.desc;
        for (var i = 0; i < secs.length; i++) {
            for (var j = i + 1; j < secs.length; j++) {
                if (secs[i] === secs[j] && secs[i] !== '') {
                    descs[i] = parseInt(descs[i]) + parseInt(descs[j]);
                    if (descs[i] === 0) {
                        types[i] = '';
                        descs[i] = '';
                        secs[i] = '';
                    }
                    types[j] = '';
                    descs[j] = '';
                    secs[j] = '';
                }
            }
        }
        // 式の並び替え
        res = sortObj(res);
        // type判定
        res.type = checkType(res);
    }
    return res;
}

// ＊の場合
function kakeru(a, b) {
    var res = {}, resSec;
    if (a.type === typeObj[1] && b.type === typeObj[1]) {
        res = {
            type: typeObj[1],
            types: [typeObj[1]],
            desc: [parseInt(a.desc) * parseInt(b.desc)],
            sec: ['']
        };
    } else {
        res = {
            type: '',
            types: [],
            desc: [],
            sec: []
        };
        for (var i = 0; i < a.sec.length; i++) {
            for (var j = 0; j < b.sec.length; j++) {
                res.desc.push(parseInt(a.desc[i]) * parseInt(b.desc[j]));
                resSec = a.sec[i] + b.sec[j]
                res.sec.push(resSec.split('').sort().join());
                if (res.sec[res.sec.length - 1] === '') {
                    res.types.push(typeObj[1]);
                } else {
                    res.types.push(typeObj[2]);
                }
            }
        }
        // 項の整理
        sortRes(res);
        // 式の並び替え
        res = sortObj(res);
        // type判定
        res.type = checkType(res);
    }
    return res;
}

// 標準入力から値を読み取る
process.stdin.on('data', function (chunk) {
    input += chunk;
});
process.stdin.on('end', function () {
    main(input);
});
