'use strict';

const max_digits = 8;
const _device_expression = document.getElementById('expression');
const _device_operand = document.getElementById('operand');

const screen = {
	//arrow functions have been used to define this object's internal methods
	set: {
		expression: (value) => { _device_expression.innerText = trim_invalid_numerics(value); },
		operand: (value) => { _device_operand.innerText = trim_invalid_numerics(value); },
	},
	clear: {
		expression: () => { _device_expression.innerText = ''; },
		operand: () => { _device_operand.innerText = ''; },
		all: () => { 
			_device_expression.innerText = '';
			_device_operand.innerText = '';
		},
	},
	get: {
		expression: () => { return _device_expression.innerText; },
		operand: () => { return _device_operand.innerText; },
	},
};

const calculation = {
	//use regular functions to define this object's internal methods
	_expression: [],
	push: function (exp) {
        if (exp != undefined || exp != null || typeof exp != 'string') { //validation so that no erroneous data is pushed to array
            this._expression.push(exp); //push value passed to .push() onto end of array
        }
        else {screen.set.operand('Error: invalid value entered')} //output error dialog
        this.debug(exp);
    },
	pop: function () {this._expression.pop()}, 
	last: function () {
        if (this._expression.length > 0) {return this._expression[this._expression.length-1]} //if array is not empty, then return array index -1 from its length (array indexing starts at 0 so -1 needed to not return undefined)
        return ''; //if previous condition does not return and break out of the function (array is empty) then this will return empty string
    },
	clear: function () {this._expression = []}, //resets array to empty
	debug: function (raw_value) {
        console.log('raw value passed to calculation.push():', raw_value);
        console.log('this._expression:', this._expression);
    }, //logs value passed into .push()
	expression: function() { //USE APPEND_VALUE HERE??????????
        let to_join = [];
        let joined_digits_expression = [];

        let join_and_validate = function() {
            let joined = to_join.join('');

            if (!valid_leadingzeros(joined)) {joined = fix_leading_zeros(joined)}
            if (!valid_decimals(joined)) {joined = fix_multi_decimals(joined)}

            joined_digits_expression.push(joined);
        };

        for (let i=0; i<this._expression.length; i++) {
            if (/[0-9.]/.test(this._expression[i])) {to_join.push(this._expression[i])}
            else if (/[\/\*\-+]/.test(this._expression[i])) {
                join_and_validate();
                joined_digits_expression.push(this._expression[i]);
                to_join = [];
            }
            else if (this._expression[i] == '=') {
                join_and_validate();
                to_join = [];
            }
            else {joined_digits_expression.push(this._expression[i])}
        }

        console.log('joined_digits_expression:', joined_digits_expression);
        
        return joined_digits_expression.toString().replaceAll(',', ' ');
    } 
};

function append_value(original, append, glue, spacer) {
    if (original == '') {return append} //if empty string is passed as argument for original parameter, just return append value
    else if (append == '') {return original} //if above statement doesnt break out of function, then if empty string is passed as argument for append parameter, just return original value

    let expression_array = [original, append]; //if previous condition does not return and break out of the function (append is not passed as empty string), then an array with original and append is created
    if (glue != '') {expression_array.splice(1, 0, glue)} //if glue is not passed as an empty string, then it is inserted between original and append to maintain the logical order of the expression. (splice with 0 items to delete will just insert glue at given index of 1)

    let array_to_string_no_format = expression_array.toString(); //converts array to string including comma that separates each item

    spacer ?? false; //nullish coalescing operator, if spacer value (optional) is not passed (e.g undefined), then the value will default to false, else it will be assigned its defined value
    if (spacer) {return array_to_string_no_format.replaceAll(',', ' ')} //if spacer is true, then each comma is replaced with a space for the respective formatting and this string is returned
    return array_to_string_no_format.replaceAll(',', ''); //if previous condition does not return and break out of the function (spacer is not true), then the commas are instead replaced with empty strings for no spacing
}

function fix_leading_zeros(number_as_string) {
    let number_as_array = number_as_string.split('');
    let first_digit_reg_exp = new RegExp(/[1-9.]/);
    let first_digit_search_index = number_as_string.search(first_digit_reg_exp);
    console.log('first_digit_search_index:', first_digit_search_index);
    
    if (first_digit_search_index != 0) {
        for (let i=0; i<first_digit_search_index; i++) { 
            number_as_array.shift();
        }
    }

    return number_as_array.join('');
};

function valid_leadingzeros(value) {
    let zero_reg_exp = new RegExp(/(0)\1/); //(0) - matches character group of 2 or more '0' characters, \1 - get first match of 0s
    let zero_search_index = value.search(zero_reg_exp); //finds index of chars that matches above regExp definitions (-1 if not matched at all)
    let decimal_search_index = value.indexOf('.'); //finds index of first '.' character (-1 if no '.' character in string)

    if (zero_search_index == -1) {return true} //if there is not 2 or more 0s in string, then simply return true because in any case a single or no 0 will return true
    
    if (decimal_search_index != -1) { //if a decimal is in string and there are multiple zeros in string
        if (zero_search_index < decimal_search_index) {return false} //if there is a first instance of more than 2 0s AND the decimal index in the string is after the first instance of 2 or more 0s (e.g 000.648), then return false
        else {return true} //if above statement is not true, then the multiple 0s are after the decimal place, which is valid so return true
    }
    else { //if decimal is not in string and there are multiple zeros in string
        if (zero_search_index == 0) {return false} //if the multiple zeros in string begin at start (e.g 000648), return false
        else {return true} //if string starts with characters other than multiple zeros (e.g 648000), return true
    }
}

function fix_multi_decimals(number_as_string) {
    let decimal_reg_exp = new RegExp(/\./g); //\. - matches '.' characters (must be escaped with \), g - find all matches of expression as opposed to first match
    let matches = number_as_string.matchAll(decimal_reg_exp); //get all instances of chars that match above regExp definitions returned as an iterator (iterators are objects that have a deterministic order)
    let number_as_array = number_as_string.split('');

    let index_array = [];
    for (let match of matches) { //iterate through iterator
        console.log('match:', match);
        index_array.push(match.index) //cant figure out how to loop through iterator objects in reverse, so just push indices to array and loop through in reverse
    }

    for (let i=index_array.length-1; i>0; i--) { //start 2nd to last, loop backwards
        console.log('i:', i);
        number_as_array.splice(index_array[i], 1); //remove decimal from number array at indices
    }

    return number_as_array.join('');
};

function valid_decimals(value) {
    if (value.includes('.')) { //only need to count decimals if value contains decimal(s)
        let decimal_reg_exp = new RegExp(/\./g); //\. - matches '.' characters (must be escaped with \), g - find all matches of expression as opposed to first match
        let matches = value.matchAll(decimal_reg_exp); //get all instances of chars that match above regExp definitions returned as an iterator (iterators are objects that have a deterministic order)
        let decimal_count = 0; //decimal counter that incremements by 1 for each match

        for (let match of matches) { //iterate through iterator
            //console.log('match:', match);
            decimal_count += 1; //count decimals caught in matchAll
            if (decimal_count > 1) {return false} //if more than 1 decimal caught, this in invalid, therefore return false
        }
        
        return true; //if loop breaks without returning false, then 1 decimal found, therefore return true
    }
    else {return true} //if 0 decimals found in value simply return true
}

function trim_invalid_numerics(value) {
    let error_output = 'ERROR';
    if (value != error_output) {
        let allowed_chars_reg_exp = new RegExp(/[0-9.\/\*\-+]/g); //[0-9.\/\*\-+] - matches digits and operator symbols (/, * and - all need to be escaped), g - find all matches of expression as opposed to first match
        let matches = value.matchAll(allowed_chars_reg_exp); //get all instances of chars that match above regExp definitions returned as an iterator (iterators are objects that have a deterministic order)
        let valid_numeric_expression = ''; //empty string will be returned if no valid chars present
    
        for (let match of matches) {valid_numeric_expression += match[0]} //iterate through iterator, cumulatively concatenate only the valid chars in their same order as original
        return valid_numeric_expression; //return either empty string or valid expression
    }
    else {return value}
}

function evaluate(expression) {
    if (expression == '') {return expression}

    try {
        let outcome = eval(expression);
        if (outcome.toString().length >= 17) {
            let outcome_array = outcome.toString().split('.');
            let places = 13 - 1 - outcome_array[0].length;
            outcome = outcome.toFixed(places);
        }
        
        return outcome.toString();  
    }
    catch {return 'ERROR'}
}

function evaluate_handle_error(expression) {
    if (evaluate(expression) != 'ERROR') {return evaluate(expression)}
    else {
        let cleaned_expression = evaluate(trim_invalid_numerics(expression));
        if (cleaned_expression != 'ERROR') {return cleaned_expression}
        else {screen.set.operand('ERROR')}
    }
}

function control_pressed(control) {
	switch(control) {
		case 'c': 
            screen.clear.operand();
            calculation.clear();
            break;
		case 'ac': 
            screen.clear.all();
            calculation.clear();
            break;
		case '=': 
            calculation.push('=');
            screen.set.expression(calculation.expression());
            screen.set.operand(
                evaluate_handle_error(
                    calculation.expression()
                )
            );
            break;
	}
}

function digit_pressed(digit) {
    if (calculation.last() == '=') {
        screen.clear.all();
        calculation.clear();
    }

    if (screen.get.operand()[0] == '0' && digit != '.') {
        calculation.pop();
        calculation.push(digit);
        screen.set.operand(digit);
    }
    else {
        calculation.push(digit);
        screen.set.operand(
            append_value(
                screen.get.operand()
            , digit, '', true)
        );
    }
}

function operator_pressed(operator) {
    if (calculation.last() == '') {return}
    else if (calculation.last() == '=') {
        let ans = evaluate_handle_error(calculation.expression());
        calculation.clear();
        calculation.push(ans);
        calculation.push(operator);
        screen.clear.operand();
        screen.set.expression(
            append_value(ans, operator, '', true)
        );
    }
    else {
        calculation.push(operator);
        screen.clear.operand();
        screen.set.expression(calculation.expression());
    }
}

let buttons = document.getElementsByClassName('button'); //search for all HTML objects that are using the class name 'button'
for(let i=0; i<buttons.length; i++) { //loop through each 'button' instance
	buttons[i].addEventListener('click', function() { //attach a 'click' event listener
    	switch(this.dataset.action) { //invoke a specific function based on the type of button 'clicked'
			//pass the ID to the selected function
			case('digit'): digit_pressed(this.id); break; 
			case('operator'): operator_pressed(this.id); break;
			case('control'): control_pressed(this.id); break;
		}
	});
}

function test_functionality() {
    /*
    if () {console.log(' test # %csuccessful', 'color: green')}
    else {console.log(' test # %cunsuccessful', 'color: red')}
    */

    //calculaton object tests
    console.log('%ccalculation object tests:', 'font-weight: bold;');
    calculation.clear();
    if (calculation._expression.length == 0) {console.log('calculation.clear() test #1 %csuccessful', 'color: green')}
    else {console.log('calculation.clear() test #1 %cunsuccessful', 'color: red')}

    calculation.push('Alpha');
    if (calculation._expression.includes('Alpha')) {console.log('calculation.push() test #1 %csuccessful', 'color: green')}
    else {console.log('c alculation.push() test #1 %cunsuccessful', 'color: red')}

    calculation.clear();
    if (calculation._expression.length == 0) {console.log('calculation.clear() test #2 %csuccessful', 'color: green')}
    else {console.log('calculation.clear() test #2 %cunsuccessful', 'color: red')}

    if (calculation.last() == '') {console.log('calculation.last() test #1 %csuccessful', 'color: green')}
    else {console.log('calculation.last() test #1 %cunsuccessful', 'color: red')}
    
    calculation.push('Beta');
    if (calculation._expression.includes('Beta')) {console.log('calculation.push() test #2 %csuccessful', 'color: green')}
    else {console.log('calculation.push() test #2 %cunsuccessful', 'color: red')}

    calculation.push('Gamma');
    if (calculation._expression.includes('Gamma')) {console.log('calculation.push() test #3 %csuccessful', 'color: green')}
    else {console.log('calculation.push() test #3 %cunsuccessful', 'color: red')}

    calculation.push('Delta');
    if (calculation._expression.includes('Delta')) {console.log('calculation.push() test #4 %csuccessful', 'color: green')}
    else {console.log('calculation.push() test #4 %cunsuccessful', 'color: red')}

    if (calculation.last() == 'Delta') {console.log('calculation.last() test #2 %csuccessful', 'color: green')}
    else {console.log('calculation.last() test #2 %cunsuccessful', 'color: red')}

    calculation.pop();
    if (!calculation._expression.includes('Delta')) {console.log('calculation.pop() #1 test %csuccessful', 'color: green')}
    else {console.log('calculation.pop() #1 test %cunsuccessful', 'color: red')}
    
    calculation.pop();
    if (!calculation._expression.includes('Gamma')) {console.log('calculation.pop() #2 test %csuccessful', 'color: green')}
    else {console.log('calculation.pop() #2 test %cunsuccessful', 'color: red')}

    if (calculation.last() == 'Beta') {console.log('calculation.last() test #3 %csuccessful', 'color: green')}
    else {console.log('calculation.last() test #3 %cunsuccessful', 'color: red')}

    calculation.push('Epsilon');
    if (calculation._expression.includes('Epsilon')) {console.log('calculation.push() test #5 %csuccessful', 'color: green')}
    else {console.log('calculation.push() test #5 %cunsuccessful', 'color: red')}

    calculation.push('Zeta');
    if (calculation._expression.includes('Zeta')) {console.log('calculation.push() test #6 %csuccessful', 'color: green')}
    else {console.log('calculation.push() test #6 %cunsuccessful', 'color: red')}

    if (calculation.expression() == 'Beta Epsilon Zeta') {console.log('calculation.expression() test #1 %csuccessful', 'color: green')}
    else {console.log('calculation.expression() test #1 %cunsuccessful', 'color: red')}

    calculation.clear();

    //append_value tests
    console.log('%cappend_value() tests:', 'font-weight: bold;');
    if (append_value('20', '30', '+', false) == '20+30') {console.log('append_value() test #1 %csuccessful', 'color: green')}
    else {console.log('append_value() test #1 %cunsuccessful', 'color: red')}

    if (append_value('20', '30', '+', true) == '20 + 30') {console.log('append_value() test #2 %csuccessful', 'color: green')}
    else {console.log('append_value() test #2 %cunsuccessful', 'color: red')}

    if (append_value('20', '30', '+') == '20+30') {console.log('append_value() test #3 %csuccessful', 'color: green')}
    else {console.log('append_value() test #3 %cunsuccessful', 'color: red')}

    if (append_value('', '30', '+', true) == '30') {console.log('append_value() test #4 %csuccessful', 'color: green')}
    else {console.log('append_value() test #4 %cunsuccessful', 'color: red')}

    if (append_value('hello', 'developer', 'there') == 'hellotheredeveloper') {console.log('append_value() test #5 %csuccessful', 'color: green')}
    else {console.log('append_value() test #5 %cunsuccessful', 'color: red')}

    if (append_value('hello', 'developer', 'there', true) == 'hello there developer') {console.log('append_value() test #6 %csuccessful', 'color: green')}
    else {console.log('append_value() test #6 %cunsuccessful', 'color: red')}

    if (append_value('hello', 'developer', '', true) == 'hello developer') {console.log('append_value() test #7 %csuccessful', 'color: green')}
    else {console.log('append_value() test #7 %cunsuccessful', 'color: red')}

    if (append_value('', '', 'alpha', true) == '') {console.log('append_value() test #8 %csuccessful', 'color: green')}
    else {console.log('append_value() test #8 %cunsuccessful', 'color: red')}

    if (append_value('alpha', '', 'beta', true) == 'alpha') {console.log('append_value() test #9 %csuccessful', 'color: green')}
    else {console.log('append_value() test #9 %cunsuccessful', 'color: red')}

    //valid_leadingzeros tests
    console.log('%cvalid_leadingzeros() tests:', 'font-weight: bold;');
    if (valid_leadingzeros('000') == false) {console.log('valid_leadingzeros() test #1 %csuccessful', 'color: green')}
    else {console.log('valid_leadingzeros() test #1 %cunsuccessful', 'color: red')}

    if (valid_leadingzeros('00') == false) {console.log('valid_leadingzeros() test #2 %csuccessful', 'color: green')}
    else {console.log('valid_leadingzeros() test #2 %cunsuccessful', 'color: red')}

    if (valid_leadingzeros('0.0') == true) {console.log('valid_leadingzeros() test #3 %csuccessful', 'color: green')}
    else {console.log('valid_leadingzeros() test #3 %cunsuccessful', 'color: red')}

    if (valid_leadingzeros('10') == true) {console.log('valid_leadingzeros() test #4 %csuccessful', 'color: green')}
    else {console.log('valid_leadingzeros() test #4 %cunsuccessful', 'color: red')}

    if (valid_leadingzeros('0.10') == true) {console.log('valid_leadingzeros() test #5 %csuccessful', 'color: green')}
    else {console.log('valid_leadingzeros() test #5 %cunsuccessful', 'color: red')}

    if (valid_leadingzeros('0.1000') == true) {console.log('valid_leadingzeros() test #6 %csuccessful', 'color: green')}
    else {console.log('valid_leadingzeros() test #6 %cunsuccessful', 'color: red')}

    if (valid_leadingzeros('0.001') == true) {console.log('valid_leadingzeros() test #7 %csuccessful', 'color: green')}
    else {console.log('valid_leadingzeros() test #7 %cunsuccessful', 'color: red')}

    if (valid_leadingzeros('00.001') == false) {console.log('valid_leadingzeros() test #8 %csuccessful', 'color: green')}
    else {console.log('valid_leadingzeros() test #8 %cunsuccessful', 'color: red')}

    if (valid_leadingzeros('10.001') == true) {console.log('valid_leadingzeros() test #9 %csuccessful', 'color: green')}
    else {console.log('valid_leadingzeros() test #9 %cunsuccessful', 'color: red')}

    if (valid_leadingzeros('111.001') == true) {console.log('valid_leadingzeros() test #10 %csuccessful', 'color: green')}
    else {console.log('valid_leadingzeros() test #10 %cunsuccessful', 'color: red')}

    if (valid_leadingzeros('011.001') == true) {console.log('valid_leadingzeros() test #11 %csuccessful', 'color: green')}
    else {console.log('valid_leadingzeros() test #11 %cunsuccessful', 'color: red')}

    if (valid_leadingzeros('0011.001') == false) {console.log('valid_leadingzeros() test #12 %csuccessful', 'color: green')}
    else {console.log('valid_leadingzeros() test #12 %cunsuccessful', 'color: red')}

    if (valid_leadingzeros('111.111') == true) {console.log('valid_leadingzeros() test #13 %csuccessful', 'color: green')}
    else {console.log('valid_leadingzeros() test #13 %cunsuccessful', 'color: red')}

    if (valid_leadingzeros('111.110') == true) {console.log('valid_leadingzeros() test #14 %csuccessful', 'color: green')}
    else {console.log('valid_leadingzeros() test #14 %cunsuccessful', 'color: red')}

    if (valid_leadingzeros('1111100') == true) {console.log('valid_leadingzeros() test #15 %csuccessful', 'color: green')}
    else {console.log('valid_leadingzeros() test #15 %cunsuccessful', 'color: red')}

    if (fix_leading_zeros('0000256') == '256') {console.log('fix_leading_zeros() test #1 %csuccessful', 'color: green')}
    else {console.log('fix_leading_zeros() test #1 %cunsuccessful', 'color: red')}

    if (fix_leading_zeros('0001011010.256') == '1011010.256') {console.log('fix_leading_zeros() test #2 %csuccessful', 'color: green')}
    else {console.log('fix_leading_zeros() test #2 %cunsuccessful', 'color: red')}

    if (fix_leading_zeros('1000256') == '1000256') {console.log('fix_leading_zeros() test #3 %csuccessful', 'color: green')}
    else {console.log('fix_leading_zeros() test #3 %cunsuccessful', 'color: red')}

    //valid_decimals tests
    console.log('%cvalid_decimals() tests:', 'font-weight: bold;');
    if (valid_decimals('0000') == true) {console.log('valid_decimals() test #1 %csuccessful', 'color: green')}
    else {console.log('valid_decimals() test #1 %cunsuccessful', 'color: red')}

    if (valid_decimals('') == true) {console.log('valid_decimals() test #2 %csuccessful', 'color: green')}
    else {console.log('valid_decimals() test #2 %cunsuccessful', 'color: red')}
    
    if (valid_decimals('0.1') == true) {console.log('valid_decimals() test #3 %csuccessful', 'color: green')}
    else {console.log('valid_decimals() test #3 %cunsuccessful', 'color: red')}
    
    if (valid_decimals('0.1.') == false) {console.log('valid_decimals() test #4 %csuccessful', 'color: green')}
    else {console.log('valid_decimals() test #4 %cunsuccessful', 'color: red')}

    if (valid_decimals('0.') == true) {console.log('valid_decimals() test #5 %csuccessful', 'color: green')}
    else {console.log('valid_decimals() test #5 %cunsuccessful', 'color: red')}

    if (valid_decimals('ABC') == true) {console.log('valid_decimals() test #6 %csuccessful', 'color: green')}
    else {console.log('valid_decimals() test #6 %cunsuccessful', 'color: red')}

    if (valid_decimals('.ABC.') == false) {console.log('valid_decimals() test #7 %csuccessful', 'color: green')}
    else {console.log('valid_decimals() test #7 %cunsuccessful', 'color: red')}

    if (valid_decimals('XYZ.ABC') == true) {console.log('valid_decimals() test #8 %csuccessful', 'color: green')}
    else {console.log('valid_decimals() test #8 %cunsuccessful', 'color: red')}

    if (valid_decimals('XYZ.ABC.') == false) {console.log('valid_decimals() test #9 %csuccessful', 'color: green')}
    else {console.log('valid_decimals() test #9 %cunsuccessful', 'color: red')}

    if (valid_decimals('XYZ.....ABC.') == false) {console.log('valid_decimals() test #10 %csuccessful', 'color: green')}
    else {console.log('valid_decimals() test #10 %cunsuccessful', 'color: red')}

    if (fix_multi_decimals('0.111.66.6') == '0.111666') {console.log('fix_multi_decimals() test #1 %csuccessful', 'color: green')}
    else {console.log('fix_multi_decimals() test #1 %cunsuccessful', 'color: red')}

    console.log('fix_multi_decimals:', fix_multi_decimals('.0111666.'));
    if (fix_multi_decimals('.0111666.') == '.0111666') {console.log('fix_multi_decimals() test #2 %csuccessful', 'color: green')}
    else {console.log('fix_multi_decimals() test #2 %cunsuccessful', 'color: red')}

    console.log('fix_multi_decimals:', fix_multi_decimals('762...54'));
    if (fix_multi_decimals('762...54') == '762.54') {console.log('fix_multi_decimals() test #3 %csuccessful', 'color: green')}
    else {console.log('fix_multi_decimals() test #3 %cunsuccessful', 'color: red')}

    //trim_invalid_numerics tests
    console.log('%ctrim_invalid_numerics() tests:', 'font-weight: bold;');
    if (trim_invalid_numerics('123') == '123') {console.log('trim_invalid_numerics() test #1 %csuccessful', 'color: green')}
    else {console.log('trim_invalid_numerics() test #1 %cunsuccessful', 'color: red')}

    if (trim_invalid_numerics(' 1 2 3 ') == '123') {console.log('trim_invalid_numerics() test #2 %csuccessful', 'color: green')}
    else {console.log('trim_invalid_numerics() test #2 %cunsuccessful', 'color: red')}

    if (trim_invalid_numerics('10!') == '10') {console.log('trim_invalid_numerics() test #3 %csuccessful', 'color: green')}
    else {console.log('trim_invalid_numerics() test #3 %cunsuccessful', 'color: red')}

    if (trim_invalid_numerics('!') == '') {console.log('trim_invalid_numerics() test #4 %csuccessful', 'color: green')}
    else {console.log('trim_invalid_numerics() test #4 %cunsuccessful', 'color: red')}

    if (trim_invalid_numerics('A0.10') == '0.10') {console.log('trim_invalid_numerics() test #5 %csuccessful', 'color: green')}
    else {console.log('trim_invalid_numerics() test #5 %cunsuccessful', 'color: red')}

    if (trim_invalid_numerics('!-10') == '-10') {console.log('trim_invalid_numerics() test #6 %csuccessful', 'color: green')}
    else {console.log('trim_invalid_numerics() test #6 %cunsuccessful', 'color: red')}

    if (trim_invalid_numerics('!+10') == '+10') {console.log('trim_invalid_numerics() test #7 %csuccessful', 'color: green')}
    else {console.log('trim_invalid_numerics() test #7 %cunsuccessful', 'color: red')}

    if (trim_invalid_numerics('') == '') {console.log('trim_invalid_numerics() test #8 %csuccessful', 'color: green')}
    else {console.log('trim_invalid_numerics() test #8 %cunsuccessful', 'color: red')}

    if (trim_invalid_numerics('5+10') == '5+10') {console.log('trim_invalid_numerics() test #9 %csuccessful', 'color: green')}
    else {console.log('trim_invalid_numerics() test #9 %cunsuccessful', 'color: red')}

    if (trim_invalid_numerics('5*10') == '5*10') {console.log('trim_invalid_numerics() test #10 %csuccessful', 'color: green')}
    else {console.log('trim_invalid_numerics() test #10 %cunsuccessful', 'color: red')}

    if (trim_invalid_numerics('5/10') == '5/10') {console.log('trim_invalid_numerics() test #11 %csuccessful', 'color: green')}
    else {console.log('trim_invalid_numerics() test #11 %cunsuccessful', 'color: red')}

    screen.set.operand('hello world!!!!');
    if (screen.get.operand() == '') {console.log('trim_invalid_numerics() test #12 %csuccessful', 'color: green')}
    else {console.log('trim_invalid_numerics() test #12 %cunsuccessful', 'color: red')}

    screen.set.expression('hello world!!!!');
    if (screen.get.expression() == '') {console.log('trim_invalid_numerics() test #13 %csuccessful', 'color: green')}
    else {console.log('trim_invalid_numerics() test #13 %cunsuccessful', 'color: red')}

    screen.set.operand('ERROR');
    if (screen.get.operand() == 'ERROR') {console.log('trim_invalid_numerics() test #14 %csuccessful', 'color: green')}
    else {console.log('trim_invalid_numerics() test #14 %cunsuccessful', 'color: red')}

    //...pressed tests
    console.log('%c...pressed() tests:', 'font-weight: bold;');
    screen.set.expression('populate expression');
    screen.set.operand('populate operand');
    control_pressed('ac');
    calculation.clear();

    operator_pressed('+');
    if (screen.get.expression() == '' && screen.get.operand() == '') {console.log('operator_pressed() test #1 %csuccessful', 'color: green')}
    else {console.log('operator_pressed() test #1 %cunsuccessful', 'color: red')}

    if (screen.get.expression() == '' && screen.get.operand() == '') {console.log('control_pressed() test #1 %csuccessful', 'color: green')}
    else {console.log('control_pressed() test #1 %cunsuccessful', 'color: red')}

    digit_pressed('9');
    if (screen.get.operand() == '9') {console.log('digit_pressed() test #1 %csuccessful', 'color: green')}
    else {console.log('digit_pressed() test #1 %cunsuccessful', 'color: red')}

    digit_pressed('1');
    if (screen.get.operand() == '91') {console.log('digit_pressed() test #2 %csuccessful', 'color: green')}
    else {console.log('digit_pressed() test #2 %cunsuccessful', 'color: red')}

    operator_pressed('+');
    if (screen.get.expression() == '91+' && screen.get.operand() == '') {console.log('operator_pressed() test #2 %csuccessful', 'color: green')}
    else {console.log('operator_pressed() test #2 %cunsuccessful', 'color: red')}

    digit_pressed('7');
    if (screen.get.operand() == '7') {console.log('digit_pressed() test #3 %csuccessful', 'color: green')}
    else {console.log('digit_pressed() test #3 test # %cunsuccessful', 'color: red')}

    control_pressed('=')
    if (screen.get.expression() == '91+7' && screen.get.operand() == '98') {console.log('control_pressed() test #2 %csuccessful', 'color: green')}
    else {console.log('control_pressed() test #2 %cunsuccessful', 'color: red')}

    operator_pressed('+');
    if (screen.get.expression() == '98+' && screen.get.operand() == '') {console.log('operator_pressed() test #3 %csuccessful', 'color: green')}
    else {console.log('operator_pressed() test #3 %cunsuccessful', 'color: red')}

    digit_pressed('0');
    digit_pressed('2');
    if (screen.get.operand() == '2') {console.log('digit_pressed() test #4 %csuccessful', 'color: green')}
    else {console.log('digit_pressed() test #4 test # %cunsuccessful', 'color: red')}

    control_pressed('ac');
    calculation.clear();

    //evaluate tests
    console.log('%cevaluate() tests:', 'font-weight: bold;');
    if (evaluate('') == '') {console.log('evaluate() test #1 %csuccessful', 'color: green')}
    else {console.log('evaluate() test #1 %cunsuccessful', 'color: red')}

    if (evaluate('20 + 50') == 70) {console.log('evaluate() test #2 %csuccessful', 'color: green')}
    else {console.log('evaluate() test #2 %cunsuccessful', 'color: red')}

    if (evaluate('20/3*1.5') == 10) {console.log('evaluate() test #3 %csuccessful', 'color: green')}
    else {console.log('evaluate() test #3 %cunsuccessful', 'color: red')}

    console.log('eval:', evaluate('20/3*0.4'));
    if (evaluate('20/3*0.4') == 2.66666666667) {console.log('evaluate() test #4 %csuccessful', 'color: green')}
    else {console.log('evaluate() test #4 %cunsuccessful', 'color: red')}

    if (evaluate('3+4*5') == 23) {console.log('evaluate() test #5 %csuccessful', 'color: green')}
    else {console.log('evaluate() test #5 %cunsuccessful', 'color: red')}

    if (evaluate('(1*1.7+1') == 'ERROR') {console.log('evaluate() test #6 %csuccessful', 'color: green')}
    else {console.log('evaluate() test #6 %cunsuccessful', 'color: red')}

    if (evaluate('87*x') == 'ERROR') {console.log('evaluate() test #7 %csuccessful', 'color: green')}
    else {console.log('evaluate() test #7 %cunsuccessful', 'color: red')}

    if (evaluate('x') == 'ERROR') {console.log('evaluate() test #8 %csuccessful', 'color: green')}
    else {console.log('evaluate() test #8 %cunsuccessful', 'color: red')}

    if (evaluate('99.9') == 99.9) {console.log('evaluate() test #9 %csuccessful', 'color: green')}
    else {console.log('evaluate() test #9 %cunsuccessful', 'color: red')}

    if (evaluate('056378+666') == 'ERROR') {console.log('evaluate() test #10 %csuccessful', 'color: green')}
    else {console.log('evaluate() test #10 %cunsuccessful', 'color: red')}
    

}

//once the oload event has fired, execute any requested functions
window.onload = () => {
    test_functionality();
    screen.clear.all();
};
