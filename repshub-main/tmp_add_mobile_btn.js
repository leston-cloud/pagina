const fs = require('fs');
const path = require('path');

const dir = 'c:/Users/mateo/OneDrive/Escritorio/repshub-main';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html')).map(f => path.join(dir, f));

const mobileRegisterHTML = `                            <!-- Solo en móvil, el botón de registrarse -->
                            <li class="nav-mobile-register">
                                <a href="https://ikako.vip/r/gonza" target="_blank" rel="noopener noreferrer" class="btn-register-mobile">Registrarse en KakoBuy</a>
                            </li>
                        </ul>`;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    
    if (content.includes('class="nav-mobile-register"')) {
        console.log(`Skipping ${file}, already has mobile register`);
        return;
    }
    
    // Replace the exact last item in existing menus to inject right before </ul>
    let replaced = content.replace(/(<li><a href="como-comprar\.html"[^>]*>Cómo Comprar<\/a><\/li>)\s*<\/ul>/, '$1\n' + mobileRegisterHTML);
    
    if (replaced !== content) {
        fs.writeFileSync(file, replaced, 'utf8');
        console.log(`Updated ${file}`);
    } else {
        console.log(`Failed to update ${file}`);
    }
});
