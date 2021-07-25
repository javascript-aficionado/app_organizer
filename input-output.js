const fs = require('fs');

//write groups of apps
function save_groups(save_file, group_names, group_list){
    let res = "";

    group_names.forEach(name=>{
        res += name + ',';
    });

    res += '\n';

    group_list.forEach(file_list => {
        file_list.forEach(file=>{
            res += file + ',';
        });

        res += '\n';
    });

    fs.writeFileSync(save_file, res, err=>{if(err) throw err;});
}

//read groups of apps
//returns an array of arrays, where entry res[i][j] is the jth directory of the ith group
function load_groups(save_file){
    let _raw_data = fs.readFileSync(save_file, {encoding: 'utf8'});
    let _groups = _raw_data.split('\n');
    let _raw_names = _groups[0];
    _groups.pop();
    _groups.splice(0, 1);

    let res = [];
    _groups.forEach(str=>{
        res.push(str.split(','));
        res[res.length - 1].pop();
    });

    let _names = _raw_names.split(',');
    _names.pop();

    return {_names: _names, _apps: res};
}

exports.save_groups = save_groups;
exports.load_groups = load_groups;