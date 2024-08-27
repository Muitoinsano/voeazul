
const TelegramBot = require('node-telegram-bot-api');
const fetch = require('node-fetch');

const token = '7328862523:AAGm1xNTwXz5tvC7DBC3l_BuEbgoEntu9bA';
const chatId = '-1002155872285';

const bot = new TelegramBot(token, { polling: true });

const apiUrl = 'https://vg-api.airtrfx.com/graphql';
const requestTemplate = {
    query: `query ($page: PageInput!, $id: String!, $pageNumber: Int, $limit: Int, $flatContext: FlatContextInput, $urlParameters: StandardFareModuleUrlParameters, $filters: StandardFareModuleFiltersInput) {
        standardFareModule(page: $page, id: $id, pageNumber: $pageNumber, limit: $limit, flatContext: $flatContext, urlParameters: $urlParameters, filters: $filters) {
            fares {
                originAirportCode
                destinationCity
                destinationAirportCode
                redemption {
                    unit
                    amount
                }
                formattedDepartureDate
                formattedReturnDate
            }
        }
    }`,
    variables: {
        page: { tenant: "ad", slug: "melhores-ofertas", siteEdition: "pt" },
        id: "6509bb6f61285648c409de19",
        pageNumber: 1,
        limit: 5,
        flatContext: { templateId: "6232e481fe2bcb1d00002c49", templateName: "home" },
        filters: { origin: null },
        urlParameters: {}
    }
};

const airports = [
    { code: "CGH", geoId: "6301857" },
    { code: "GRU", geoId: "6300629" },
    { code: "VCP", geoId: "6300637" }
];

async function fetchFlights(airport) {
    console.log(`Iniciando busca para o aeroporto ${airport.code}...`);

    const requests = Array.from({ length: 6 }, (_, i) => {
        const request = { ...requestTemplate };
        request.variables.filters.origin = airport;
        request.variables.pageNumber = i + 1;

        return fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(request)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Erro HTTP na página ${i+1} para o aeroporto ${airport.code}: Status ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            const fares = data.data.standardFareModule.fares;
            console.log(`Página ${i+1} do aeroporto ${airport.code}: ${fares.length} ofertas encontradas.`);
            return fares;
        })
        .catch(error => {
            console.error(`Erro ao buscar a página ${i+1} para o aeroporto ${airport.code}: ${error.message}`);
            return [];
        });
    });

    const results = await Promise.all(requests);
    return results.flat();
}

function formatarAeroporto(originAirportCode){
    if(originAirportCode === "CGH") return "Congonhas"
    if(originAirportCode === "GRU") return "Guarulhos"
    if(originAirportCode === "VCP") return "Viracopos"
}

async function main() {
    try {
        console.log('Iniciando busca de voos...');
        const allFlights = await Promise.all(airports.map(fetchFlights));
        const filteredFlights = allFlights.flat().filter(flight => flight.redemption.amount === 8000);

        if (filteredFlights.length > 0) {
            console.log(`Foram encontrados ${filteredFlights.length} voos por 8K pontos.`);
            let message = 'Voos de origem em São Paulo disponíveis por 8K pontos:\n\n';
            filteredFlights.forEach(flight => {
                message += `🛫 ${formatarAeroporto(flight.originAirportCode)} → ${flight.destinationCity}(${flight.destinationAirportCode})\n`;
                message += `🔹 Ida: ${flight.formattedDepartureDate}\n`;
                message += `🔹 Volta: ${flight.formattedReturnDate}\n\n`;
            });

            bot.sendMessage(chatId, message);
            console.log('Mensagem enviada ao grupo do Telegram.');
        } else {
            const noFlightsMessage = 'Não foram encontrados voos por 8K pontos.';
            bot.sendMessage(chatId, noFlightsMessage);
            console.log(noFlightsMessage);
        }
    } catch (error) {
        const errorMessage = `Ocorreu um erro: ${error.message}`;
        bot.sendMessage(chatId, errorMessage);
        console.error(errorMessage);
    }
}

main();

