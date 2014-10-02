/*jslint vars: true, plusplus: true, devel: true, nomen: true, maxerr: 50, regexp: true, browser:true */

var spendingEntry = {
    validate : function (inputType, str) {
        'use strict';
        if (inputType === 'event') {
            return (/^[a-zA-Z '-.]+$/).test(str);
        } else if (inputType === 'spending') {
            return (/^\d+$/).test(str);
        } else if (inputType === 'token') {
            return (/^[a-zA-Z0-9{7}]+$/).test(str);
        }
        
    },
    submitSpending : function () {
        'use strict';
        var txtEvent = document.getElementById('txt-event'),
            txtSpending = document.getElementById('txt-spending'),
            txtToken = document.getElementById('txt-token'),
            arrTxt = [ [txtEvent, 'event'], [txtSpending, 'spending'], [txtToken, 'token'] ],
            txtLen = arrTxt.length,
            i,
            val,
            count = 0,
            theForm = document.getElementById('form-spending');
        
        for (i = 0; i < txtLen; i++) {
            val = this.validate(arrTxt[i][1], arrTxt[i][0].value);
            if (!val) {
                arrTxt[i][0].className = 'error';
            } else {
                arrTxt[i][0].className = '';
                count++;
            }
        }
        
        if (count === 3) {
            theForm.submit();
        }
    }
};

