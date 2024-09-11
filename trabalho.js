class Grafo {
    constructor(direcional, ponderado, numNos) {
        this.direcional = direcional;
        this.ponderado = ponderado;
        this.grafo = {};
        this.nos = Array.from({ length: numNos }, (_, i) => String.fromCharCode(65 + i)); // A, B, C, ...
        this.nos.forEach(no => this.grafo[no] = []); // Inicializando os nós
    }

    adicionarAresta(origem, destino, peso = null) {
        // Verifica se o nó de origem e destino estão dentro do número de nós permitido
        if (!this.nos.includes(origem) || !this.nos.includes(destino)) {
            console.log("Erro: Origem ou destino fora do limite de nós.");
            return;
        }

        // Verifica se a aresta já existe para evitar duplicatas
        if (this.grafo[origem].some(aresta => this.ponderado ? aresta.destino === destino : aresta === destino)) {
            console.log(`Erro: Aresta de ${origem} para ${destino} já existe.`);
            return;
        }

        // Se for ponderado, adicionar peso
        if (this.ponderado) {
            this.grafo[origem].push({ destino, peso });
        } else {
            this.grafo[origem].push(destino);
        }

        // Se for não direcional, adicionar conexão reversa, também verificando duplicatas
        if (!this.direcional) {
            if (this.grafo[destino].some(aresta => this.ponderado ? aresta.destino === origem : aresta === origem)) {
                return;
            }
            if (this.ponderado) {
                this.grafo[destino].push({ destino: origem, peso });
            } else {
                this.grafo[destino].push(origem);
            }
        }
    }

    imprimirGrafo() {
        for (const no in this.grafo) {
            let conexoes = this.grafo[no].map(aresta => {
                if (this.ponderado) {
                    return `(${aresta.destino}: ${aresta.peso})`;
                } else {
                    return `( -> ${aresta})`;
                }
            }).join(' ');
            console.log(`${no}: ${conexoes}`);
        }
    }
}


function montarGrafo() {
    const prompt = require("prompt-sync")();

    let tipoGrafo = null;
    while (tipoGrafo !== '1' && tipoGrafo !== '2') {
        tipoGrafo = prompt("Digite 1 para grafo direcional não ponderado ou 2 para grafo não direcional ponderado: ");
    }

    const direcional = tipoGrafo === '1';
    const ponderado = tipoGrafo === '2';

    const numNos = parseInt(prompt("Digite o número de nós do grafo (máx 26, de A a Z): "), 10);
    if (numNos > 26 || numNos <= 0) {
        console.log("Erro: O número de nós deve estar entre 1 e 26.");
        return;
    }

    const grafo = new Grafo(direcional, ponderado, numNos);

    // Exibir os nós criados
    console.log("Nós disponíveis: ", grafo.nos.join(', '));

    console.log("Para adicionar arestas, informe origem, destino e, se for ponderado, informe o peso. Digite 0 para sair.");

    while (true) {
        const origem = prompt("Informe o nó de origem (ou 0 para sair): ").toUpperCase();
        if (origem === '0') break;

        const destino = prompt("Informe o nó de destino: ").toUpperCase();

        let peso = null;
        if (ponderado) {
            peso = parseInt(prompt("Informe o peso da aresta: "), 10);
            if (isNaN(peso) || peso < 0) {
                console.log("Peso inválido. Deve ser um número não negativo.");
                continue;
            }
        }

        grafo.adicionarAresta(origem, destino, peso);
    }

    // Direcionar para o menu correto
    if (direcional) {
        menuDirecionalNaoPonderado(grafo);
    } else {
        menuNaoDirecionalPonderado(grafo);
    }
}

function ordenacaoTopologicaInterativa(grafo) {
    const prompt = require("prompt-sync")();
    const nos = grafo.nos;
    const adjacencias = grafo.grafo;
    const visitado = {};
    const indegree = {}; // Armazena o grau de entrada de cada nó
    const ordenacao = [];
    const passos = [];
    const descoberta = {}; // Ordem de descoberta de cada nó
    const finalizacao = {}; // Ordem de finalização de cada nó
    const finalizacaoOrdem = []; // Ordem de finalização dos nós para determinar a ordenação topológica
    let contador = 1; // Contador para a ordem de descoberta e finalização

    // Inicializa todos os nós como não visitados e calcula o grau de entrada (indegree) de cada nó
    nos.forEach(no => {
        visitado[no] = false;
        indegree[no] = 0;
        descoberta[no] = null;
        finalizacao[no] = null;
    });

    // Calcula o grau de entrada de cada nó
    nos.forEach(no => {
        adjacencias[no].forEach(aresta => {
            const destino = grafo.ponderado ? aresta.destino : aresta;
            indegree[destino]++;
        });
    });

    // Identifica os nós sem dependências (grau de entrada 0)
    function getNosSemDependencias() {
        return nos.filter(no => indegree[no] === 0 && !visitado[no]);
    }

    // Função para realizar o DFS a partir de um nó
    function dfs(no) {
        visitado[no] = true;
        descoberta[no] = contador++; // Define a ordem de descoberta do nó
        passos.push(`Nó ${no} descoberto na ordem ${descoberta[no]}`);

        // Explora todos os vizinhos do nó atual
        adjacencias[no].forEach(aresta => {
            const vizinho = grafo.ponderado ? aresta.destino : aresta;
            if (!visitado[vizinho]) {
                indegree[vizinho]--;
                if (indegree[vizinho] === 0) {
                    dfs(vizinho);
                }
            }
        });

        finalizacao[no] = contador++; // Define a ordem de finalização do nó
        passos.push(`Nó ${no} finalizado na ordem ${finalizacao[no]}`);
        finalizacaoOrdem.push(no); // Armazena o nó pela ordem de finalização para a ordenação topológica
    }

    // Fluxo principal da ordenação topológica interativa
    while (true) {
        const nosSemDependencias = getNosSemDependencias();

        if (nosSemDependencias.length === 0) {
            // Verifica se todos os nós foram visitados
            const todosVisitados = nos.every(no => visitado[no]);
            if (!todosVisitados) {
                passos.push("Ciclo detectado ou grafo com dependências cíclicas. Ordenação não possível.");
                console.log("\n--- Erro ---");
                console.log("Ciclo detectado ou grafo com dependências cíclicas. Ordenação não possível.");
            } else {
                // Ordenação topológica: reverso da ordem de finalização
                const ordenacaoTopologica = finalizacaoOrdem.reverse().join(' -> ');
                passos.push(`Ordenação Topológica Completa: ${ordenacaoTopologica}`);
                console.log("\n--- Ordenação Topológica ---");
                console.log(ordenacaoTopologica);
            }
            break;
        }

        // Exibe os nós sem dependências ao usuário
        console.log("\n--- Nós Sem Dependências ---");
        console.log(nosSemDependencias.join(', '));

        const escolha = prompt("Escolha um nó para iniciar a ordenação: ").toUpperCase();
        
        if (!nosSemDependencias.includes(escolha)) {
            console.log("Nó inválido ou já processado. Tente novamente.");
            continue;
        }

        // Processa o nó escolhido pelo usuário
        dfs(escolha);
    }

    // Exibe o passo a passo de descoberta e finalização
    console.log("\n--- Ordem de Descoberta e Finalização dos Nós ---");
    nos.forEach(no => {
        console.log(`Nó ${no}: Descoberta (${descoberta[no]}), Finalização (${finalizacao[no]})`);
    });
}

// Função para encontrar o grafo transposto de um grafo direcional não ponderado
function encontrarGrafoTransposto(grafo) {
    const grafoTransposto = new Grafo(grafo.direcional, grafo.ponderado, grafo.nos.length); // Cria um novo grafo com as mesmas características do original

    // Percorre todos os nós do grafo original
    grafo.nos.forEach(no => {
        // Percorre todas as arestas do nó atual
        grafo.grafo[no].forEach(aresta => {
            const destino = grafo.ponderado ? aresta.destino : aresta; // Obtém o destino da aresta
            grafoTransposto.adicionarAresta(destino, no); // Adiciona a aresta invertida no grafo transposto
        });
    });

    return grafoTransposto;
}

const descoberta = {};
const finalizacao = {};
function buscaEmProfundidadeInterativa(grafo) {
    const prompt = require("prompt-sync")();
    const visitado = new Set();
    const tempo = { count: 0 }; // Objeto para contagem do tempo de descoberta e finalização
    const ordemDescobertaFinalizacao = [];

    function dfs(no) {
        visitado.add(no);
        tempo.count++;
        descoberta[no] = tempo.count;
        console.log(`Descoberta do nó ${no}: tempo = ${tempo.count}`);

        grafo.grafo[no].forEach(aresta => {
            const destino = grafo.ponderado ? aresta.destino : aresta;
            if (!visitado.has(destino)) {
                dfs(destino);
            }
        });

        tempo.count++;
        finalizacao[no] = tempo.count;
        console.log(`Finalização do nó ${no}: tempo = ${tempo.count}`);
        ordemDescobertaFinalizacao.push(no);
    }

    function obterNosSemDependencias() {
        const nosComDependencias = new Set();
        grafo.nos.forEach(no => {
            grafo.grafo[no].forEach(aresta => {
                const destino = grafo.ponderado ? aresta.destino : aresta;
                nosComDependencias.add(destino);
            });
        });

        // Nós sem dependências são aqueles que não estão na lista de nós com dependências
        return grafo.nos.filter(no => !nosComDependencias.has(no) && !visitado.has(no));
    }

    while (visitado.size < grafo.nos.length) {
        const nosSemDependencias = obterNosSemDependencias();
        if (nosSemDependencias.length === 0) {
            console.log("Todos os nós já foram visitados ou não há nós sem dependências.");
            break;
        }

        console.log("Nós sem dependências disponíveis para iniciar a busca:");
        console.log(nosSemDependencias.join(', '));

        const noInicial = prompt("Escolha um nó para iniciar a busca em profundidade: ").toUpperCase();
        if (!nosSemDependencias.includes(noInicial)) {
            console.log("Nó inválido. Por favor, escolha um nó válido da lista.");
            continue;
        }

        dfs(noInicial);
    }

    // Exibe a ordem de descoberta e finalização de cada nó
    console.log("\nOrdem de descoberta e finalização dos nós:");
    grafo.nos.forEach(no => {
        if (descoberta[no]) {
            console.log(`${no} (${descoberta[no]}/${finalizacao[no]})`);
        }
    });

    // Exibe a ordem da busca em profundidade
    console.log("\nOrdem da busca em profundidade:");
    console.log(ordemDescobertaFinalizacao.reverse().join(' -> '));
}

function componentesFortementeConectados(grafo) {
    const nos = grafo.nos;
    const visitado = {};
    const pilha = [];
    const componentes = [];
    const passos = []; // Armazena os passos para exibir ao usuário

    passos.push("Iniciando a busca dos Componentes Fortemente Conectados...");

    // Inicializa todos os nós como não visitados
    nos.forEach(no => visitado[no] = false);

    // Primeira DFS: Preencher a pilha com base no tempo de finalização (ordem de finalização)
    function dfsPreencherPilha(no) {
        visitado[no] = true;
        passos.push(`Explorando nó ${no} e preenchendo a pilha...`);
        grafo.grafo[no].forEach(aresta => {
            const destino = grafo.ponderado ? aresta.destino : aresta;
            if (!visitado[destino]) {
                dfsPreencherPilha(destino);
            }
        });
        pilha.push(no); // Após explorar todos os vizinhos, empilha o nó
        passos.push(`Nó ${no} empilhado.`);
    }

    // Segunda DFS: Marcar componentes no grafo transposto
    function dfsMarcarComponentes(no, componenteAtual, grafoTransposto) {
        visitado[no] = true;
        componenteAtual.push(no);
        passos.push(`Explorando nó ${no} no grafo transposto e marcando componente.`);
        grafoTransposto.grafo[no].forEach(aresta => {
            const destino = grafoTransposto.ponderado ? aresta.destino : aresta;
            if (!visitado[destino]) {
                dfsMarcarComponentes(destino, componenteAtual, grafoTransposto);
            }
        });
    }

    // Passo 1: Preenche a pilha com base na ordem de finalização dos nós
    passos.push("Executando a primeira busca em profundidade (DFS) para preencher a pilha...");
    nos.forEach(no => {
        if (!visitado[no]) {
            dfsPreencherPilha(no);
        }
    });

    // Passo 2: Transpor o grafo
    passos.push("Transpondo o grafo (invertendo as arestas)...");
    const grafoTransposto = encontrarGrafoTransposto(grafo); // Função já implementada

    // Passo 3: Fazer DFS no grafo transposto na ordem inversa da pilha
    passos.push("Executando a segunda DFS no grafo transposto para encontrar os componentes fortemente conectados...");
    nos.forEach(no => visitado[no] = false); // Reseta os nós como não visitados
    while (pilha.length > 0) {
        const noAtual = pilha.pop();
        if (!visitado[noAtual]) {
            const componenteAtual = [];
            passos.push(`Iniciando nova DFS a partir do nó ${noAtual} para identificar um componente fortemente conectado.`);
            dfsMarcarComponentes(noAtual, componenteAtual, grafoTransposto);
            componentes.push(componenteAtual);
            passos.push(`Componente fortemente conectado encontrado: ${componenteAtual.join(', ')}`);
        }
    }

    // Exibir os passos
    console.log("\n--- Passo a Passo da Busca pelos Componentes Fortemente Conectados ---");
    passos.forEach(passo => console.log(passo));

    // Exibir os componentes fortemente conectados
    console.log("\n--- Componentes Fortemente Conectados ---");
    componentes.forEach((componente, index) => {
        console.log(`Componente ${index + 1}: ${componente.join(', ')}`);
    });

    return componentes;
}


function menuDirecionalNaoPonderado(grafo) {
    const prompt = require("prompt-sync")();
    while (true) {
        console.log("\n--- Menu (Grafo Direcional Não Ponderado) ---");
        console.log("1. Exibir Grafo");
        console.log("2. Ordenação Topológica");
        console.log("3. Componentes Fortemente Conectados");
        console.log("0. Sair");

        const opcao = prompt("Escolha uma opção: ");

        switch (opcao) {
            case '1':
                grafo.imprimirGrafo();
                break;
            case '2':
                ordenacaoTopologicaInterativa(grafo);
                break;
            case '3':
                componentesFortementeConectados(grafo);
                break;
            case '0':
                console.log("Encerrando...");
                return;
            default:
                console.log("Opção inválida. Tente novamente.");
        }
    }
}


function dijkstra(grafo) {
    const prompt = require("prompt-sync")();
    
    // Solicita ao usuário para selecionar o nó inicial e o nó objetivo
    const inicio = prompt("Escolha o nó inicial: ").toUpperCase();
    const objetivo = prompt("Escolha o nó objetivo: ").toUpperCase();
    
    // Verificar se o nó inicial e o objetivo existem no grafo
    if (!grafo.nos.includes(inicio) || !grafo.nos.includes(objetivo)) {
        console.log("Erro: Nó inicial ou objetivo inválido.");
        return;
    }

    const distancias = {};
    const visitados = {};
    const predecessores = {}; // Armazena o caminho mais curto
    const naoVisitados = new Set(grafo.nos);

    // Inicializa as distâncias de todos os nós como infinito, exceto o nó inicial
    grafo.nos.forEach(no => {
        distancias[no] = Infinity;
        predecessores[no] = null;
    });
    distancias[inicio] = 0;

    // Função auxiliar para encontrar o nó não visitado com a menor distância
    function encontrarNoMaisProximo() {
        let menorDistancia = Infinity;
        let noMaisProximo = null;

        naoVisitados.forEach(no => {
            if (distancias[no] < menorDistancia) {
                menorDistancia = distancias[no];
                noMaisProximo = no;
            }
        });

        return noMaisProximo;
    }

    // Algoritmo principal de Dijkstra
    while (naoVisitados.size > 0) {
        const noAtual = encontrarNoMaisProximo();

        if (noAtual === null || noAtual === objetivo) {
            // Parar a busca se chegarmos ao nó objetivo
            break;
        }

        // Remove o nó atual da lista de não visitados
        naoVisitados.delete(noAtual);
        visitados[noAtual] = true;

        // Atualiza as distâncias dos vizinhos do nó atual
        grafo.grafo[noAtual].forEach(aresta => {
            const vizinho = aresta.destino;
            const peso = aresta.peso;

            if (!visitados[vizinho]) {
                const novaDistancia = distancias[noAtual] + peso;
                if (novaDistancia < distancias[vizinho]) {
                    distancias[vizinho] = novaDistancia;
                    predecessores[vizinho] = noAtual;
                }
            }
        });

        // Exibir o estado atual das distâncias e predecessores
        console.log(`Estado após visitar o nó ${noAtual}:`);
        console.log("Distâncias atuais:");
        grafo.nos.forEach(no => {
            console.log(`Nó ${no}: distância = ${distancias[no]}, predecessor = ${predecessores[no]}`);
        });
        console.log("---------------------------");
    }

    // Exibir o caminho e a distância para o nó objetivo
    if (distancias[objetivo] === Infinity) {
        console.log(`Não há caminho entre ${inicio} e ${objetivo}.`);
    } else {
        const caminho = [];
        let noAtual = objetivo;

        while (noAtual !== null) {
            caminho.unshift(noAtual);
            noAtual = predecessores[noAtual];
        }

        console.log(`Menor caminho de ${inicio} até ${objetivo}: ${caminho.join(' -> ')}`);
        console.log(`Distância total: ${distancias[objetivo]}`);
    }
}

function aStar(grafo) {
    const prompt = require("prompt-sync")();

    // Solicita ao usuário o nó inicial, o nó objetivo e as heurísticas
    const inicio = prompt("Escolha o nó inicial: ").toUpperCase();
    const objetivo = prompt("Escolha o nó objetivo: ").toUpperCase();

    // Verifica se o nó inicial e o objetivo existem no grafo
    if (!grafo.nos.includes(inicio) || !grafo.nos.includes(objetivo)) {
        console.log("Erro: Nó inicial ou objetivo inválido.");
        return;
    }

    // Solicita ao usuário as heurísticas de cada nó
    const heuristicas = {};
    grafo.nos.forEach(no => {
        heuristicas[no] = parseInt(prompt(`Informe a heurística (h) do nó ${no}: `), 10);
    });

    // Inicializa as estruturas de dados
    const g = {}; // g(n): custo acumulado do nó inicial até o nó n
    const f = {}; // f(n) = g(n) + h(n): custo estimado total do caminho passando por n
    const predecessores = {}; // Predecessores para reconstruir o caminho mais curto
    const filaPrioridade = new Set(); // Fila de prioridade para armazenar nós a explorar

    // Inicializa os valores
    grafo.nos.forEach(no => {
        g[no] = Infinity;
        f[no] = Infinity;
        predecessores[no] = null;
    });

    g[inicio] = 0;
    f[inicio] = heuristicas[inicio];
    filaPrioridade.add(inicio);

    // Função auxiliar para encontrar o nó na fila de prioridade com menor valor de f(n)
    function encontrarNoComMenorF() {
        let menorF = Infinity;
        let noMaisProximo = null;

        filaPrioridade.forEach(no => {
            if (f[no] < menorF) {
                menorF = f[no];
                noMaisProximo = no;
            }
        });

        return noMaisProximo;
    }

    // Algoritmo A*
    while (filaPrioridade.size > 0) {
        const noAtual = encontrarNoComMenorF();
        filaPrioridade.delete(noAtual);

        // Verifica se o nó atual é o objetivo
        if (noAtual === objetivo) {
            // Reconstrói o caminho a partir do objetivo
            const caminho = [];
            let passo = objetivo;

            while (passo !== null) {
                caminho.unshift(passo);
                passo = predecessores[passo];
            }

            console.log(`Menor caminho de ${inicio} até ${objetivo}: ${caminho.join(' -> ')}`);
            console.log(`Custo total: ${g[objetivo]}`);
            return;
        }

        // Atualiza os vizinhos do nó atual
        grafo.grafo[noAtual].forEach(aresta => {
            const vizinho = aresta.destino;
            const peso = aresta.peso;

            // Calcula o custo acumulado para o vizinho através do nó atual
            const gTemp = g[noAtual] + peso;

            if (gTemp < g[vizinho]) {
                predecessores[vizinho] = noAtual;
                g[vizinho] = gTemp;
                f[vizinho] = gTemp + heuristicas[vizinho];

                if (!filaPrioridade.has(vizinho)) {
                    filaPrioridade.add(vizinho);
                }
            }
        });

        // Exibe o estado atual das distâncias e heurísticas
        console.log(`Estado após visitar o nó ${noAtual}:`);
        console.log("Valores de g e f atuais:");
        grafo.nos.forEach(no => {
            console.log(`Nó ${no}: g = ${g[no]}, f = ${f[no]}, predecessor = ${predecessores[no]}`);
        });
        console.log("---------------------------");
    }

    // Se a fila de prioridade estiver vazia e não atingimos o objetivo
    console.log(`Não há caminho entre ${inicio} e ${objetivo}.`);
}




function menuNaoDirecionalPonderado(grafo) {
    const prompt = require("prompt-sync")();
    while (true) {
        console.log("\n--- Menu (Grafo Não Direcional Ponderado) ---");
        console.log("1. Exibir Grafo");
        console.log("2. Algoritmo de Dijkstra");
        console.log("3. Algoritmo A*"); // Adiciona a opção para o A*
        console.log("0. Sair");

        const opcao = prompt("Escolha uma opção: ");

        switch (opcao) {
            case '1':
                grafo.imprimirGrafo();
                break;
            case '2':
                dijkstra(grafo);
                break;
            case '3':
                aStar(grafo); // Chama a função A*
                break;
            case '0':
                console.log("Encerrando...");
                return;
            default:
                console.log("Opção inválida. Tente novamente.");
        }
    }
}

montarGrafo();