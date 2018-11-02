module.exports = {

    format(number, type, decimal = 2) {
        var prefix = number < 0 ? "-" : "";
        prefix =  ['currency','currency-small'].indexOf(type) > -1 ? prefix + "$" : prefix;

        if (type === 'currency-small') {
            if (number >= 1000000000) {
                return prefix + Math.round(number / 1000000000) + 'b';
            } else if (number >= 1000000) {
                return prefix + Math.round(number / 1000000) + 'm';
            } else if (number >= 1000) {
                return prefix + Math.round(number / 1000) + 'k';
            } else {
                return prefix + Math.round(number);
            }
        } else if (type === 'scientific') {
            if (number < 1 && number * 10 < 1 && number > 0) {
                var mult = 0;
                var num = number;
                while (num < 1) {
                    mult += 1;
                    num = num * 10;
                }
                return "" + Number(Math.abs(num)).toFixed(2) + "e-" + mult;
            } else {
                number = Number(Math.abs(number)).toFixed(3);

                var parts = number.toString().split(".");
                parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
                return prefix + parts.join(".");
            }
        } else if (type === 'integer-small') {
            if (number >= 1000000000) {
                return Math.round(number / 1000000000) + 'b';
            } else if (number >= 1000000) {
                return Math.round(number / 1000000) + 'm';
            } else if (number >= 1000) {
                return Math.round(number / 1000) + 'k';
            } else {
                return Math.round(number);
            }
        } else {
            number = Number(Math.abs(number)).toFixed(decimal);

            var parts = number.toString().split(".");
            parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
            return prefix + parts.join(".");
        }
    },

    formatTime(milliseconds) {
        var seconds = milliseconds / 1000;
        var secondsInMinute = 60;
        var secondsInHour = secondsInMinute * 60;
        var secondsInDay = secondsInHour * 24;
        var days = Math.ceil(seconds / secondsInDay);

        return days;
    },

    formatTimeString(timeString) {
        let time = new Date(timeString.replace(/-/g, '/') + ' UTC');
        let unix = time.getTime() / 1000;
        let now = Date.now() / 1000;
        let diff = now - unix;

        let interval = Math.floor(diff / 2592000);
        if (interval > 1) {
            return timeString;
        }

        interval = Math.floor(diff / 86400);
        if (interval > 0) {
            return interval > 1 ? interval + " days ago" : interval + " day ago";
        }

        interval = Math.floor(diff / 3600);
        if (interval > 0) {
            return interval > 1 ? interval + " hours ago" : interval + " hour ago";
        }

        interval = Math.floor(diff / 60);
        if (interval > 0) {
            return interval > 1 ? interval + " minutes ago" : interval + " minute ago";
        }

        return "Now";
    },

    formatTimeSeconds(diff) {

        let interval = Math.floor(diff / 2592000);

        let months = 0, days = 0, hours = 0, minutes = 0;

        if (interval > 0) {
            months = interval;
        }
        diff = diff % 2592000;

        interval = Math.floor(diff / 86400);
        if (interval > 0) {
            days = interval;
        }
        diff = diff % 86400;

        interval = Math.floor(diff / 3600);
        if (interval > 0) {
            hours = interval;
        }
        diff = diff % 3600;

        interval = Math.floor(diff / 60);
        if (interval > 0) {
            minutes = interval;
        }

        let time = '';
        if (months > 0) {
            time += months + 'mo ';
        }

        if (days > 0) {
            time += time !== '' ? days + 'd' : days + 'd ';
        }

        if (months > 0 && days > 0) {
            return time;
        }

        if (hours > 0) {
            time += time !== '' ? hours + 'h' : hours + 'h ';
        }

        if ((months > 0 || days > 0) && hours > 0) {
            return time;
        }

        if (minutes > 0) {
            time += minutes + 'm';
        }

        if (hours > 0 || months > 0 || days > 0 || minutes > 0) {
            return time;
        }

        return time + '<1m';
    },

    formatFloat(str, type = 'decimal', places = 2) {
        let num = (Math.round(parseFloat(str) * 100) / 100).toFixed(2);
        let formatter = new Intl.NumberFormat('en-US', {
            style: type,
            minimumFractionDigits: places
        });
        return formatter.format(num);
    }
};