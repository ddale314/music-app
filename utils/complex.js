export class Complex {
    constructor(real, imaginary) {
        this.real = real;
        this.imaginary = imaginary;
    }

    add(other) {
        let result = new Complex(this.real + other.real, this.imaginary + other.imaginary);
        return result;
    }

    subtract(other) {
        let result = new Complex(this.real - other.real, this.imaginary - other.imaginary);
        return result;
    }

    magnitude() {
        return Math.sqrt(this.real*this.real + this.imaginary*this.imaginary);
    }

    multiply(other) {
        let r = this.real*other.real - this.imaginary*other.imaginary;
        let i = this.imaginary*other.real + this.real*other.imaginary;
        let result = new Complex(r, i);
        return result;
    }

    realDivide(real) {
        return new Complex(this.real/real, this.imaginary/real);
    }

    toString() {
        return this.real + ' + ' + this.imaginary + 'i';
    }
}

export function fft(amplitudes, inverse) {
    const n = amplitudes.length;
    if (n == 1) {
        return;
    }

    let even = [];
    let odd = [];
    even.length = n/2;
    odd.length = n/2;

    for (let i = 0; 2*i < n; i++) {
        even[i] = amplitudes[2*i];
        odd[i] = amplitudes[2*i+1];
    }

    fft(even, inverse);
    fft(odd, inverse);
    let angle = 2 * Math.PI / n * (inverse ? -1 : 1);
    let w = new Complex(1, 0);
    let step = new Complex(Math.cos(angle), Math.sin(angle));
    for (let i = 0; 2*i < n; i++) {
        amplitudes[i] = even[i].add(w.multiply(odd[i]));
        amplitudes[i + n/2] = even[i].subtract(w.multiply(odd[i]));

        if (inverse) {
            amplitudes[i] = amplitudes[i].realDivide(2);
            amplitudes[i + n/2] = amplitudes[i + n/2].realDivide(2);
        }
        
        w = w.multiply(step);
    }

}