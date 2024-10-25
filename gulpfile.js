const path = require('path');
const fs = require('fs');
const { glob } = require('glob');
const { src, dest, watch, series } = require('gulp');
const dartSass = require('gulp-dart-sass'); // Cambiado a gulp-dart-sass
const terser = require('gulp-terser');
const sharp = require('sharp');

// No se necesita crear una instancia de Sass; simplemente se puede usar directamente
const sass = dartSass();

const paths = {
    scss: 'src/scss/**/*.scss',
    js: 'src/js/**/*.js'
};

function css(done) {
    src(paths.scss, { sourcemaps: true })
        .pipe(sass({
            outputStyle: 'compressed'
        }).on('error', sass.logError))
        .pipe(dest('./public/build/css', { sourcemaps: '.' }));
    done();
}

function js(done) {
    src(paths.js)
        .pipe(terser())
        .pipe(dest('./public/build/js'));
    done();
}

async function imagenes(done) {
    const srcDir = './src/img';
    const buildDir = './public/build/img';
    const images = await glob('./src/img/**/*');

    images.forEach(file => {
        const relativePath = path.relative(srcDir, path.dirname(file));
        const outputSubDir = path.join(buildDir, relativePath);
        procesarImagenes(file, outputSubDir);
    });
    done();
}

function procesarImagenes(file, outputSubDir) {
    if (!fs.existsSync(outputSubDir)) {
        fs.mkdirSync(outputSubDir, { recursive: true });
    }
    const baseName = path.basename(file, path.extname(file));
    const extName = path.extname(file);

    if (extName.toLowerCase() === '.svg') {
        const outputFile = path.join(outputSubDir, `${baseName}${extName}`);
        fs.copyFileSync(file, outputFile);
    } else {
        const outputFile = path.join(outputSubDir, `${baseName}${extName}`);
        const outputFileWebp = path.join(outputSubDir, `${baseName}.webp`);
        const outputFileAvif = path.join(outputSubDir, `${baseName}.avif`);
        const options = { quality: 80 };

        sharp(file).jpeg(options).toFile(outputFile);
        sharp(file).webp(options).toFile(outputFileWebp);
        sharp(file).avif().toFile(outputFileAvif);
    }
}

function dev() {
    watch(paths.scss, css);
    watch(paths.js, js);
    watch('src/img/**/*.{png,jpg}', imagenes);
}

exports.css = css;
exports.js = js;
exports.imagenes = imagenes;
exports.dev = dev;
exports.default = series(js, css, imagenes, dev);
