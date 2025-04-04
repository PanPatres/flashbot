// Konfigurácia
const BOT_TOKEN = 'NAHRAĎ_NOVÝM_TOKENOM'; // Resetni token v Discord Developer Portali a vlož nový
const WELCOME_CHANNEL_ID = '1350593918516990044'; // Skontroluj, či kanál existuje
const WELCOME_ROLE_ID = '1350591766973120573'; // Skontroluj, či rola existuje
const RULES_CHANNEL = '#pravidlá';
const EMBED_COLOR = '#00ff00';
const FORM_RESPONSE_CHANNEL_ID = '1357058992211361922'; // Skontroluj, či kanál existuje
const REQUIRED_ROLES = ['1350592769420296265', '1350589130811248650']; // Skontroluj, či role existujú
const APPROVE_ROLE_ID = '1356199980884561951'; // Skontroluj, či rola existuje
const REJECT_ROLE_ID = '1357059219244716068'; // Skontroluj, či rola existuje
const TRANSCRIPT_CHANNEL_ID = '1357058992211361923'; // Skontroluj, či kanál existuje

// Role, ktoré majú prístup k príkazom /ban, /kick, /mute
const MODERATOR_ROLES = ['1350592769420296265', '1350589130811248650']; // Skontroluj, či role existujú

// Ticket kategórie pre každý typ ticketu
const TICKET_CATEGORIES = {
    faction: '1350754953215606825', // Skontroluj, či kategória existuje
    unban: '1350754953215606826',   // Skontroluj, či kategória existuje
    ck: '1350754953215606827',      // Skontroluj, či kategória existuje
    support: '1350754953215606828'  // Skontroluj, či kategória existuje
};
const SUPPORT_ROLE_ID = '1350592769420296265'; // Skontroluj, či rola existuje

// Konfigurácia otázok formulára (10 otázok)
const FORM_QUESTIONS = [
    // Prvý modál (otázky 1-5)
    {
        id: 'join_reason',
        label: 'Odkud jsi se dozvěděl o serveru?', // 35 znakov
        style: 'Paragraph',
        required: true
    },
    {
        id: 'enjoy_most',
        label: 'Co bys chtěl u nás RPit?', // 24 znakov
        style: 'Paragraph',
        required: true
    },
    {
        id: 'dislike',
        label: 'Co bys dělal při neprávem banu?', // 31 znakov
        style: 'Paragraph',
        required: true
    },
    {
        id: 'improve',
        label: 'Jak bys definoval roleplay?', // 27 znakov
        style: 'Paragraph',
        required: true
    },
    {
        id: 'experience',
        label: 'Jaké máš zkušenosti s RP?', // 26 znakov
        style: 'Paragraph',
        required: true
    },
    // Druhý modál (otázky 6-10)
    {
        id: 'motivation',
        label: 'Proč chceš být součástí serveru?', // 32 znakov
        style: 'Paragraph',
        required: true
    },
    {
        id: 'character',
        label: 'Jakou postavu bys chtěl hrát?', // 29 znakov
        style: 'Paragraph',
        required: true
    },
    {
        id: 'rules',
        label: 'Jak rozumíš pravidlům serveru?', // 31 znakov
        style: 'Paragraph',
        required: true
    },
    {
        id: 'teamwork',
        label: 'Jak zvládáš spolupráci v týmu?', // 30 znakov
        style: 'Paragraph',
        required: true
    },
    {
        id: 'suggestions',
        label: 'Máš návrhy na zlepšení serveru?', // 31 znakov
        style: 'Paragraph',
        required: true
    }
];

// Dočasné úložisko odpovedí
const userResponses = new Map();

// Import modulov
const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, SlashCommandBuilder, PermissionFlagsBits, ChannelType, StringSelectMenuBuilder } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildModeration // Potrebné pre ban/kick/mute
    ]
});

// Globálne ošetrenie chýb
process.on('unhandledRejection', (reason, promise) => {
    console.error('Nepošetrená chyba v Promise:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('Nepošetrená výnimka:', error);
});

// Bot ready event
client.once('ready', async () => {
    console.log(`Bot je pripravený! Připojen jako ${client.user.tag}`);
    console.log('Registrujem slash príkazy...');

    // Registrácia slash príkazov
    const commands = [
        new SlashCommandBuilder()
            .setName('formular')
            .setDescription('Zobrazí formulár pre vstup do komunity'),
        new SlashCommandBuilder()
            .setName('ticketpanel')
            .setDescription('Vytvorí panel pre ticket systém')
            .addChannelOption(option =>
                option.setName('channel')
                    .setDescription('Kanál, kam sa pošle ticket panel')
                    .setRequired(true)),
        new SlashCommandBuilder()
            .setName('ban')
            .setDescription('Zabanuje používateľa zo servera')
            .addUserOption(option =>
                option.setName('target')
                    .setDescription('Používateľ, ktorého chceš zabanovať')
                    .setRequired(true))
            .addStringOption(option =>
                option.setName('reason')
                    .setDescription('Dôvod banu')
                    .setRequired(false))
            .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers), // Vyžaduje oprávnenie BanMembers
        new SlashCommandBuilder()
            .setName('kick')
            .setDescription('Vyhodí používateľa zo servera')
            .addUserOption(option =>
                option.setName('target')
                    .setDescription('Používateľ, ktorého chceš vyhodiť')
                    .setRequired(true))
            .addStringOption(option =>
                option.setName('reason')
                    .setDescription('Dôvod vyhodenia')
                    .setRequired(false))
            .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers), // Vyžaduje oprávnenie KickMembers
        new SlashCommandBuilder()
            .setName('mute')
            .setDescription('Stlmí používateľa na serveri')
            .addUserOption(option =>
                option.setName('target')
                    .setDescription('Používateľ, ktorého chceš stlmiť')
                    .setRequired(true))
            .addStringOption(option =>
                option.setName('duration')
                    .setDescription('Dĺžka stlmenia (napr. 1h, 30m, 1d)')
                    .setRequired(true))
            .addStringOption(option =>
                option.setName('reason')
                    .setDescription('Dôvod stlmenia')
                    .setRequired(false))
            .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers) // Vyžaduje oprávnenie ModerateMembers
    ];

    try {
        await client.application.commands.set(commands);
        console.log('Slash príkazy úspešne zaregistrované!');
    } catch (error) {
        console.error('Chyba pri registrácii slash príkazov:', error);
    }
});

// Welcome správa pre nových členov
client.on('guildMemberAdd', async (member) => {
    console.log(`Nový člen: ${member.user.tag}`);
    try {
        const roleId = WELCOME_ROLE_ID;
        if (roleId) {
            const role = member.guild.roles.cache.get(roleId);
            if (role) {
                await member.roles.add(role);
                console.log(`Pridaná rola ${role.name} používateľovi ${member.user.tag}`);
            } else {
                console.log('Rola s daným ID nebola nájdená!');
            }
        }

        const welcomeChannelId = WELCOME_CHANNEL_ID;
        if (!welcomeChannelId) {
            console.log('Welcome channel ID nie je nastavené!');
            return;
        }

        const welcomeChannel = member.guild.channels.cache.get(welcomeChannelId);
        if (!welcomeChannel) {
            console.log('Kanál s daným ID nebol nájdený!');
            return;
        }

        const welcomeEmbed = new EmbedBuilder()
            .setColor(EMBED_COLOR)
            .setTitle('Vitaj na serveri!')
            .setDescription(`Ahoj ${member.user.tag}, vitaj na ${member.guild.name}!`)
            .addFields(
                { name: 'Si člen číslo:', value: `${member.guild.memberCount}`, inline: true },
                { name: 'Nezabudni si prečítať:', value: RULES_CHANNEL, inline: true }
            )
            .setThumbnail(member.user.displayAvatarURL())
            .setTimestamp()
            .setFooter({ text: 'Tešíme sa na teba!' });

        await welcomeChannel.send({ embeds: [welcomeEmbed] });
        console.log(`Welcome správa odoslaná pre ${member.user.tag}`);
    } catch (error) {
        console.error('Chyba pri vítaní nového člena:', error);
    }
});

// Spracovanie slash príkazov
client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    console.log(`Spracovávam príkaz: ${interaction.commandName} od ${interaction.user.tag}`);

    const { commandName } = interaction;

    if (commandName === 'formular') {
        try {
            // Vytvorenie embedu
            const embed = new EmbedBuilder()
                .setTitle('FORMULÁŘ')
                .setDescription(
                    'Ke vstupu do naší komunity je největší potřeba udělat jednoduchý formulář!\n' +
                    'Vyplňte tento jednoduchý formulář a vyčkejte než vám na to někdo z **INTERVIEW TEAMU** odpoví!\n\n' +
                    '***Prosíme aby jste formulář vyplňovali pravdivě a bez použití AI!***\n' +
                    'Po schválení formuláře se může vrhnout na 2. část whitelist procesu a to jsou samostatné pohovory!'
                )
                .setColor(EMBED_COLOR)
                .setFooter({ text: 'Etherix Bot' });

            // Vytvorenie tlačítka
            const button = new ButtonBuilder()
                .setCustomId('formular_button')
                .setLabel('FORMULÁŘ')
                .setStyle(ButtonStyle.Primary);

            const row = new ActionRowBuilder().addComponents(button);

            // Odoslanie embedu s tlačítkom
            await interaction.reply({ embeds: [embed], components: [row] });
            console.log('Formulár embed odoslaný');
        } catch (error) {
            console.error('Chyba pri príkaze /formular:', error);
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: 'Došlo k chybe pri vytváraní formulára.', ephemeral: true }).catch(err => console.error('Chyba pri followUp:', err));
            } else {
                await interaction.reply({ content: 'Došlo k chybe pri vytváraní formulára.', ephemeral: true }).catch(err => console.error('Chyba pri odpovedi:', err));
            }
        }
    }

    if (commandName === 'ticketpanel') {
        try {
            const channel = interaction.options.getChannel('channel');
            if (!channel.isTextBased()) {
                await interaction.reply({ content: 'Vybraný kanál musí byť textový!', ephemeral: true });
                return;
            }

            const embed = new EmbedBuilder()
                .setTitle('Ticket Systém')
                .setDescription('Vyber si typ ticketu, ktorý chceš vytvoriť, z rozbaľovacieho menu nižšie!')
                .setColor(EMBED_COLOR)
                .setFooter({ text: 'Etherix Bot' });

            // Vytvorenie rozbaľovacieho menu
            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('select_ticket_type')
                .setPlaceholder('Vyber typ ticketu...')
                .addOptions([
                    {
                        label: 'Žiadosť o frakciu',
                        description: 'Vytvorí ticket pre žiadosť o frakciu',
                        value: 'faction',
                        emoji: '📜'
                    },
                    {
                        label: 'Žiadosť o unban',
                        description: 'Vytvorí ticket pre žiadosť o unban',
                        value: 'unban',
                        emoji: '📩'
                    },
                    {
                        label: 'Žiadosť o CK',
                        description: 'Vytvorí ticket pre žiadosť o character kill',
                        value: 'ck',
                        emoji: '💀'
                    },
                    {
                        label: 'Žiadosť o support',
                        description: 'Vytvorí ticket pre podporu',
                        value: 'support',
                        emoji: '🛡️'
                    }
                ]);

            const row = new ActionRowBuilder().addComponents(selectMenu);

            await channel.send({ embeds: [embed], components: [row] });
            await interaction.reply({ content: `Ticket panel bol vytvorený v kanáli ${channel}!`, ephemeral: true });
            console.log('Ticket panel vytvorený');
        } catch (error) {
            console.error('Chyba pri príkaze /ticketpanel:', error);
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: 'Došlo k chybe pri vytváraní ticket panelu.', ephemeral: true }).catch(err => console.error('Chyba pri followUp:', err));
            } else {
                await interaction.reply({ content: 'Došlo k chybe pri vytváraní ticket panelu.', ephemeral: true }).catch(err => console.error('Chyba pri odpovedi:', err));
            }
        }
    }

    if (commandName === 'ban') {
        try {
            // Kontrola, či má používateľ povolenú rolu
            const hasModeratorRole = MODERATOR_ROLES.some(roleId => interaction.member.roles.cache.has(roleId));
            if (!hasModeratorRole) {
                await interaction.reply({ content: 'Nemáš oprávnenie na použitie tohto príkazu!', ephemeral: true });
                return;
            }

            const target = interaction.options.getMember('target');
            const reason = interaction.options.getString('reason') || 'Žiadny dôvod nebol uvedený';

            if (!target) {
                await interaction.reply({ content: 'Nepodarilo sa nájsť používateľa.', ephemeral: true });
                return;
            }

            if (!target.bannable) {
                await interaction.reply({ content: 'Nemôžem zabanovať tego používateľa. Skontroluj moje oprávnenia alebo hierarchiu rolí.', ephemeral: true });
                return;
            }

            await target.ban({ reason });
            await interaction.reply({ content: `Používateľ ${target.user.tag} bol zabanovaný. Dôvod: ${reason}` });
            console.log(`Používateľ ${target.user.tag} zabanovaný`);
        } catch (error) {
            console.error('Chyba pri príkaze /ban:', error);
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: `Chyba pri banovaní: ${error.message}`, ephemeral: true }).catch(err => console.error('Chyba pri followUp:', err));
            } else {
                await interaction.reply({ content: `Chyba pri banovaní: ${error.message}`, ephemeral: true }).catch(err => console.error('Chyba pri odpovedi:', err));
            }
        }
    }

    if (commandName === 'kick') {
        try {
            // Kontrola, či má používateľ povolenú rolu
            const hasModeratorRole = MODERATOR_ROLES.some(roleId => interaction.member.roles.cache.has(roleId));
            if (!hasModeratorRole) {
                await interaction.reply({ content: 'Nemáš oprávnenie na použitie tohto príkazu!', ephemeral: true });
                return;
            }

            const target = interaction.options.getMember('target');
            const reason = interaction.options.getString('reason') || 'Žiadny dôvod nebol uvedený';

            if (!target) {
                await interaction.reply({ content: 'Nepodarilo sa nájsť používateľa.', ephemeral: true });
                return;
            }

            if (!target.kickable) {
                await interaction.reply({ content: 'Nemôžem vyhodiť tohto používateľa. Skontroluj moje oprávnenia alebo hierarchiu rolí.', ephemeral: true });
                return;
            }

            await target.kick(reason);
            await interaction.reply({ content: `Používateľ ${target.user.tag} bol vyhodený. Dôvod: ${reason}` });
            console.log(`Používateľ ${target.user.tag} vyhodený`);
        } catch (error) {
            console.error('Chyba pri príkaze /kick:', error);
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: `Chyba pri vyhadzovaní: ${error.message}`, ephemeral: true }).catch(err => console.error('Chyba pri followUp:', err));
            } else {
                await interaction.reply({ content: `Chyba pri vyhadzovaní: ${error.message}`, ephemeral: true }).catch(err => console.error('Chyba pri odpovedi:', err));
            }
        }
    }

    if (commandName === 'mute') {
        try {
            // Kontrola, či má používateľ povolenú rolu
            const hasModeratorRole = MODERATOR_ROLES.some(roleId => interaction.member.roles.cache.has(roleId));
            if (!hasModeratorRole) {
                await interaction.reply({ content: 'Nemáš oprávnenie na použitie tohto príkazu!', ephemeral: true });
                return;
            }

            const target = interaction.options.getMember('target');
            const duration = interaction.options.getString('duration');
            const reason = interaction.options.getString('reason') || 'Žiadny dôvod nebol uvedený';

            if (!target) {
                await interaction.reply({ content: 'Nepodarilo sa nájsť používateľa.', ephemeral: true });
                return;
            }

            if (!target.moderatable) {
                await interaction.reply({ content: 'Nemôžem stlmiť tohto používateľa. Skontroluj moje oprávnenia alebo hierarchiu rolí.', ephemeral: true });
                return;
            }

            // Parsovanie trvania (napr. 1h, 30m, 1d)
            const timeUnits = { 's': 1000, 'm': 60 * 1000, 'h': 60 * 60 * 1000, 'd': 24 * 60 * 60 * 1000 };
            const match = duration.match(/^(\d+)([smhd])$/);
            if (!match) {
                await interaction.reply({ content: 'Neplatný formát trvania. Použi napr. 1h, 30m, 1d.', ephemeral: true });
                return;
            }

            const amount = parseInt(match[1]);
            const unit = match[2];
            const durationMs = amount * timeUnits[unit];

            if (durationMs > 28 * 24 * 60 * 60 * 1000) { // Discord limit pre timeout je 28 dní
                await interaction.reply({ content: 'Trvanie nemôže presiahnuť 28 dní.', ephemeral: true });
                return;
            }

            await target.timeout(durationMs, reason);
            await interaction.reply({ content: `Používateľ ${target.user.tag} bol stlmený na ${duration}. Dôvod: ${reason}` });
            console.log(`Používateľ ${target.user.tag} stlmený na ${duration}`);
        } catch (error) {
            console.error('Chyba pri príkaze /mute:', error);
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: `Chyba pri stlmení: ${error.message}`, ephemeral: true }).catch(err => console.error('Chyba pri followUp:', err));
            } else {
                await interaction.reply({ content: `Chyba pri stlmení: ${error.message}`, ephemeral: true }).catch(err => console.error('Chyba pri odpovedi:', err));
            }
        }
    }
});

// Interakcia s tlačítkami, rozbaľovacím menu a modálmi
client.on('interactionCreate', async interaction => {
    if (!interaction.isButton() && !interaction.isModalSubmit() && !interaction.isStringSelectMenu()) return;

    console.log(`Spracovávam interakciu: ${interaction.customId} od ${interaction.user.tag}`);

    // Prvý modál (po stlačení tlačidla FORMULÁŘ)
    if (interaction.isButton() && interaction.customId === 'formular_button') {
        try {
            const modal = new ModalBuilder()
                .setCustomId('feedback_form_part1')
                .setTitle('Formulár - Časť 1/2');

            const rows = FORM_QUESTIONS.slice(0, 5).map(question => {
                const input = new TextInputBuilder()
                    .setCustomId(question.id)
                    .setLabel(question.label)
                    .setStyle(TextInputStyle[question.style])
                    .setRequired(question.required)
                    .setMaxLength(4000); // Povolíme až 4000 znakov pre odpovede
                return new ActionRowBuilder().addComponents(input);
            });

            console.log(`Počet komponentov v modáli 1: ${rows.length}`);
            modal.addComponents(...rows);
            await interaction.showModal(modal);
            console.log('Zobrazený prvý modál');
        } catch (error) {
            console.error('Chyba pri zobrazení prvého modálu:', error);
        }
    }

    // Spracovanie prvého modálu a zobrazenie tlačidla na pokračovanie
    if (interaction.isModalSubmit() && interaction.customId === 'feedback_form_part1') {
        try {
            const responsesPart1 = {};
            FORM_QUESTIONS.slice(0, 5).forEach(question => {
                responsesPart1[question.id] = interaction.fields.getTextInputValue(question.id);
            });

            // Uloženie odpovedí z prvého modálu
            userResponses.set(interaction.user.id, responsesPart1);

            // Vytvorenie tlačidla na pokračovanie
            const continueButton = new ButtonBuilder()
                .setCustomId('continue_to_part2')
                .setLabel('Pokračovať na druhú časť')
                .setStyle(ButtonStyle.Primary);

            const row = new ActionRowBuilder().addComponents(continueButton);

            // Odpoveď s tlačidlom
            await interaction.reply({
                content: 'Prvá časť formulára bola uložená. Klikni na tlačidlo pre pokračovanie.',
                components: [row],
                ephemeral: true
            });
            console.log('Prvá časť formulára uložená');
        } catch (error) {
            console.error('Chyba pri spracovaní prvého modálu:', error);
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: 'Došlo k chybe pri spracovaní formulára.', ephemeral: true }).catch(err => console.error('Chyba pri followUp:', err));
            } else {
                await interaction.reply({ content: 'Došlo k chybe pri spracovaní formulára.', ephemeral: true }).catch(err => console.error('Chyba pri odpovedi:', err));
            }
        }
    }

    // Zobrazenie druhého modálu po stlačení tlačidla "Pokračovať"
    if (interaction.isButton() && interaction.customId === 'continue_to_part2') {
        try {
            const modal = new ModalBuilder()
                .setCustomId('feedback_form_part2')
                .setTitle('Formulár - Časť 2/2');

            const rows = FORM_QUESTIONS.slice(5, 10).map(question => {
                const input = new TextInputBuilder()
                    .setCustomId(question.id)
                    .setLabel(question.label)
                    .setStyle(TextInputStyle[question.style])
                    .setRequired(question.required)
                    .setMaxLength(4000); // Povolíme až 4000 znakov pre odpovede
                return new ActionRowBuilder().addComponents(input);
            });

            console.log(`Počet komponentov v modáli 2: ${rows.length}`);
            modal.addComponents(...rows);
            await interaction.showModal(modal);
            console.log('Zobrazený druhý modál');
        } catch (error) {
            console.error('Chyba pri zobrazení druhého modálu:', error);
        }
    }

    // Spracovanie druhého modálu a odoslanie odpovedí
    if (interaction.isModalSubmit() && interaction.customId === 'feedback_form_part2') {
        try {
            const responsesPart2 = {};
            FORM_QUESTIONS.slice(5, 10).forEach(question => {
                responsesPart2[question.id] = interaction.fields.getTextInputValue(question.id);
            });

            // Získanie odpovedí z prvého modálu
            const responsesPart1 = userResponses.get(interaction.user.id) || {};
            const allResponses = { ...responsesPart1, ...responsesPart2 };

            // Vytvorenie embedu s odpoveďami
            const fields = FORM_QUESTIONS.map(q => ({
                name: q.label,
                value: allResponses[q.id] || 'Není vyplněno',
                inline: false
            }));

            const responseEmbed = new EmbedBuilder()
                .setTitle('Nový formulář odeslán')
                .setDescription(`Odpovědi od uživatele: ${interaction.user.tag} (${interaction.user.id})`)
                .addFields(fields)
                .setColor(EMBED_COLOR)
                .setTimestamp();

            const approveButton = new ButtonBuilder()
                .setCustomId(`approve_${interaction.user.id}`)
                .setLabel('Schválit')
                .setStyle(ButtonStyle.Success);

            const rejectButton = new ButtonBuilder()
                .setCustomId(`reject_${interaction.user.id}`)
                .setLabel('Zamítnout')
                .setStyle(ButtonStyle.Danger);

            const actionRow = new ActionRowBuilder().addComponents(approveButton, rejectButton);

            const responseChannel = client.channels.cache.get(FORM_RESPONSE_CHANNEL_ID);
            if (responseChannel) {
                await responseChannel.send({ embeds: [responseEmbed], components: [actionRow] });
                console.log('Formulár odoslaný do kanála');
            } else {
                console.log('Kanál pre odpovede formulára nebol nájdený!');
            }

            // Odstránenie dočasných odpovedí
            userResponses.delete(interaction.user.id);

            await interaction.reply({ content: 'Děkujeme za vyplnění formuláře! Náš tým ho brzy zkontroluje.', ephemeral: true });
            console.log('Formulár úspešne spracovaný');
        } catch (error) {
            console.error('Chyba pri spracovaní druhého modálu:', error);
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: 'Došlo k chybe pri spracovaní formulára.', ephemeral: true }).catch(err => console.error('Chyba pri followUp:', err));
            } else {
                await interaction.reply({ content: 'Došlo k chybe pri spracovaní formulára.', ephemeral: true }).catch(err => console.error('Chyba pri odpovedi:', err));
            }
        }
    }

    // Vytvorenie ticketu po výbere z rozbaľovacieho menu
    if (interaction.isStringSelectMenu() && interaction.customId === 'select_ticket_type') {
        try {
            const guild = interaction.guild;
            const user = interaction.user;
            const ticketType = interaction.values[0]; // Hodnota vybraná z menu (faction, unban, ck, support)

            console.log(`Vytváram ticket typu ${ticketType} pre ${user.tag}`);

            // Určenie popisu ticketu a kategórie na základe typu
            let ticketDescription, ticketCategoryId;
            if (ticketType === 'faction') {
                ticketDescription = 'Vitaj v tvojom tickete pre **Žiadosť o frakciu**! Popíš svoju požiadavku a podporný tím ti čoskoro odpovie.';
                ticketCategoryId = TICKET_CATEGORIES.faction;
            } else if (ticketType === 'unban') {
                ticketDescription = 'Vitaj v tvojom tickete pre **Žiadosť o unban**! Popíš svoju situáciu a podporný tím ti čoskoro odpovie.';
                ticketCategoryId = TICKET_CATEGORIES.unban;
            } else if (ticketType === 'ck') {
                ticketDescription = 'Vitaj v tvojom tickete pre **Žiadosť o CK**! Popíš svoju požiadavku a podporný tím ti čoskoro odpovie.';
                ticketCategoryId = TICKET_CATEGORIES.ck;
            } else if (ticketType === 'support') {
                ticketDescription = 'Vitaj v tvojom tickete pre **Žiadosť o support**! Popíš svoj problém a podporný tím ti čoskoro odpovie.';
                ticketCategoryId = TICKET_CATEGORIES.support;
            }

            // Skontrolovať, či už používateľ nemá ticket
            const existingTicket = guild.channels.cache.find(channel => 
                channel.name === `ticket-${ticketType}-${user.username.toLowerCase()}` && 
                channel.topic === user.id
            );

            if (existingTicket) {
                await interaction.reply({ content: `Už máš vytvorený ticket: ${existingTicket}!`, ephemeral: true });
                console.log('Používateľ už má ticket');
                return;
            }

            // Skontrolovať, či kategória existuje
            const category = guild.channels.cache.get(ticketCategoryId);
            if (!category || category.type !== ChannelType.GuildCategory) {
                await interaction.reply({ content: `Kategória pre tento typ ticketu (${ticketType}) neexistuje! Kontaktuj administrátora servera.`, ephemeral: true });
                console.log('Kategória neexistuje');
                return;
            }

            // Vytvorenie ticket kanála v príslušnej kategórii
            const ticketChannel = await guild.channels.create({
                name: `ticket-${ticketType}-${user.username.toLowerCase()}`,
                type: ChannelType.GuildText, // Textový kanál
                topic: user.id,
                parent: ticketCategoryId, // Použije sa kategória podľa typu ticketu
                permissionOverwrites: [
                    {
                        id: user.id,
                        allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory']
                    },
                    {
                        id: guild.roles.everyone,
                        deny: ['ViewChannel']
                    },
                    {
                        id: SUPPORT_ROLE_ID,
                        allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory']
                    }
                ]
            });

            // Vytvorenie embedu a tlačidla na zatvorenie ticketu
            const ticketEmbed = new EmbedBuilder()
                .setTitle(`Ticket od ${user.tag}`)
                .setDescription(ticketDescription)
                .setColor(EMBED_COLOR)
                .setTimestamp();

            const closeButton = new ButtonBuilder()
                .setCustomId('close_ticket')
                .setLabel('Zatvoriť Ticket')
                .setStyle(ButtonStyle.Danger);

            const row = new ActionRowBuilder().addComponents(closeButton);

            await ticketChannel.send({ content: `<@${user.id}>`, embeds: [ticketEmbed], components: [row] });
            await interaction.reply({ content: `Tvoj ticket bol vytvorený: ${ticketChannel}!`, ephemeral: true });
            console.log('Ticket úspešne vytvorený');
        } catch (error) {
            console.error('Chyba pri vytváraní ticketu:', error);
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: 'Došlo k chybe pri vytváraní ticketu.', ephemeral: true }).catch(err => console.error('Chyba pri followUp:', err));
            } else {
                await interaction.reply({ content: 'Došlo k chybe pri vytváraní ticketu.', ephemeral: true }).catch(err => console.error('Chyba pri odpovedi:', err));
            }
        }
    }

    // Zatvorenie ticketu a vytvorenie transcriptu
    if (interaction.isButton() && interaction.customId === 'close_ticket') {
        try {
            const channel = interaction.channel;
            if (!channel.name.startsWith('ticket-')) {
                await interaction.reply({ content: 'Tento kanál nie je ticket!', ephemeral: true });
                return;
            }

            console.log(`Zatváram ticket: ${channel.name}`);

            // Získanie používateľa, ktorý vytvoril ticket
            const userId = channel.topic;
            const user = await client.users.fetch(userId).catch(() => null);
            if (!user) {
                await interaction.reply({ content: 'Nepodarilo sa nájsť používateľa, ktorý vytvoril tento ticket.', ephemeral: true });
                console.log('Používateľ ticketu nebol nájdený');
                return;
            }

            // Vytvorenie transcriptu
            const messages = await channel.messages.fetch({ limit: 100 }); // Získame posledných 100 správ
            let transcript = `**Transcript ticketu: ${channel.name}**\n\n`;
            messages.forEach(msg => {
                const timestamp = msg.createdAt.toLocaleString('sk-SK');
                transcript += `[${timestamp}] ${msg.author.tag}: ${msg.content || '*(prázdna správa)*'}\n`;
                if (msg.embeds.length > 0) {
                    transcript += `*(Embed: ${msg.embeds[0].description || 'bez popisu'})*\n`;
                }
            });

            // Vytvorenie embedu pre transcript
            const transcriptEmbed = new EmbedBuilder()
                .setTitle(`Transcript ticketu: ${channel.name}`)
                .setDescription('Tu je záznam správ z ticketu.')
                .addFields(
                    { name: 'Vytvoril', value: user.tag, inline: true },
                    { name: 'Zatvoril', value: interaction.user.tag, inline: true },
                    { name: 'Dátum zatvorenia', value: new Date().toLocaleString('sk-SK'), inline: true }
                )
                .setColor(EMBED_COLOR)
                .setTimestamp()
                .setFooter({ text: 'Etherix Bot' });

            // Pridanie transcriptu ako text (ak je príliš dlhý, skrátime ho)
            const transcriptField = transcript.length > 1024 ? transcript.substring(0, 1021) + '...' : transcript;
            transcriptEmbed.addFields({ name: 'Obsah ticketu', value: transcriptField });

            // Odoslanie transcriptu do vybraného kanála
            const transcriptChannel = client.channels.cache.get(TRANSCRIPT_CHANNEL_ID);
            if (transcriptChannel) {
                await transcriptChannel.send({ embeds: [transcriptEmbed] });
                console.log('Transcript odoslaný do kanála');
            } else {
                console.log('Kanál pre transcripty nebol nájdený!');
            }

            // Odoslanie transcriptu do PM používateľovi
            try {
                await user.send({ embeds: [transcriptEmbed] });
                console.log('Transcript odoslaný do PM');
            } catch (error) {
                console.log(`Nepodarilo sa poslať transcript do PM používateľovi ${user.tag}: ${error.message}`);
            }

            // Zatvorenie ticketu
            await channel.delete();
            console.log('Ticket zatvorený');

            // Oznámenie používateľovi, že ticket bol zatvorený
            try {
                await user.send('Tvoj ticket bol zatvorený. Transcript bol odoslaný do tvojich súkromných správ.');
                console.log('Oznámenie o zatvorení odoslané do PM');
            } catch (error) {
                console.log(`Nepodarilo sa poslať DM používateľovi ${user.tag}: ${error.message}`);
            }
        } catch (error) {
            console.error('Chyba pri zatváraní ticketu:', error);
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: 'Došlo k chybe pri zatváraní ticketu.', ephemeral: true }).catch(err => console.error('Chyba pri followUp:', err));
            } else {
                await interaction.reply({ content: 'Došlo k chybe pri zatváraní ticketu.', ephemeral: true }).catch(err => console.error('Chyba pri odpovedi:', err));
            }
        }
    }

    // Spracovanie tlačidiel approve/reject
    if (interaction.isButton() && (interaction.customId.startsWith('approve_') || interaction.customId.startsWith('reject_'))) {
        try {
            const [action, userId] = interaction.customId.split('_');
            const member = interaction.member;
            const hasRequiredRole = REQUIRED_ROLES.some(roleId => member.roles.cache.has(roleId));

            if (!hasRequiredRole) {
                await interaction.reply({ content: 'Nemáš oprávnenie k tejto akcii. Potrebuješ jednu z rolí pre schvaľovanie.', ephemeral: true });
                return;
            }

            const guild = interaction.guild;
            const targetMember = await guild.members.fetch(userId).catch(() => null);

            if (!targetMember) {
                await interaction.reply({ content: 'Užívateľ nebol nájdený na serveri.', ephemeral: true });
                console.log('Cieľový používateľ nebol nájdený');
                return;
            }

            if (action === 'approve') {
                const role = guild.roles.cache.get(APPROVE_ROLE_ID);
                if (!role) {
                    await interaction.reply({ content: 'Rola pre schválenie nebola nájdená.', ephemeral: true });
                    console.log('Rola pre schválenie nebola nájdená');
                    return;
                }
                await targetMember.roles.add(role);

                // Poslanie DM používateľovi po schválení v embede
                const approver = interaction.user.tag; // Meno osoby, ktorá schválila
                const dmEmbed = new EmbedBuilder()
                    .setTitle('Formulár schválený')
                    .setDescription(`Tvoj formulár bol schválený používateľom **${approver}**. Prosím, ozvi sa mu ohľadom dohody času na pohovor!`)
                    .setColor(EMBED_COLOR)
                    .setTimestamp()
                    .setFooter({ text: 'Etherix Bot' });

                // Pokus o poslanie DM, ak zlyhá, ignorujeme chybu
                try {
                    await targetMember.send({ embeds: [dmEmbed] });
                    console.log('DM o schválení odoslané');
                } catch (dmError) {
                    console.log(`Nepodarilo sa poslať DM používateľovi ${targetMember.user.tag}: ${dmError.message}`);
                }

                // Odpoveď na interakciu
                await interaction.reply({ content: `Užívateľovi ${targetMember.user.tag} bola pridaná rola pre schválenie.`, ephemeral: true });
                console.log('Formulár schválený');
            } else if (action === 'reject') {
                const role = guild.roles.cache.get(REJECT_ROLE_ID);
                if (!role) {
                    await interaction.reply({ content: 'Rola pre zamietnutie nebola nájdená.', ephemeral: true });
                    console.log('Rola pre zamietnutie nebola nájdená');
                    return;
                }
                await targetMember.roles.add(role);

                // Odpoveď na interakciu
                await interaction.reply({ content: `Užívateľovi ${targetMember.user.tag} bola pridaná rola pre zamietnutie.`, ephemeral: true });
                console.log('Formulár zamietnutý');
            }

            const updatedRow = new ActionRowBuilder().addComponents(
                ButtonBuilder.from(interaction.message.components[0].components[0]).setDisabled(true),
                ButtonBuilder.from(interaction.message.components[0].components[1]).setDisabled(true)
            );
            await interaction.message.edit({ components: [updatedRow] });
        } catch (error) {
            console.error('Chyba pri spracovaní approve/reject:', error);
            if (error.code === 50013) {
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ content: 'Nemám oprávnenie pridať túto rolu. Skontroluj moje oprávnenia a hierarchiu rolí.', ephemeral: true }).catch(err => console.error('Chyba pri followUp:', err));
                } else {
                    await interaction.reply({ content: 'Nemám oprávnenie pridať túto rolu. Skontroluj moje oprávnenia a hierarchiu rolí.', ephemeral: true }).catch(err => console.error('Chyba pri odpovedi:', err));
                }
            } else {
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ content: `Došlo k chybe: ${error.message}`, ephemeral: true }).catch(err => console.error('Chyba pri followUp:', err));
                } else {
                    await interaction.reply({ content: `Došlo k chybe: ${error.message}`, ephemeral: true }).catch(err => console.error('Chyba pri odpovedi:', err));
                }
            }
        }
    }
});

// Spracovanie správ (príkazy)
client.on('messageCreate', async message => {
    if (message.author.bot) return;

    console.log(`Spracovávam správu od ${message.author.tag}: ${message.content}`);

    if (message.content === '/embed') {
        try {
            const embed = new EmbedBuilder()
                .setTitle('Můj první embed')
                .setDescription('Tady je nějaký text v embedu!')
                .setColor(EMBED_COLOR)
                .setFooter({ text: 'Etherix Bot' });
            await message.channel.send({ embeds: [embed] });
            console.log('Embed odoslaný');
        } catch (error) {
            console.error('Chyba pri príkaze /embed:', error);
        }
    }

    if (message.content.startsWith('/role')) {
        try {
            const args = message.content.split(' ').slice(1);
            const roleName = args.join(' ');
            if (!roleName) return message.channel.send('Napiš jméno role, např. `/role Member`');

            const role = message.guild.roles.cache.find(r => r.name === roleName);
            if (!role) return message.channel.send(`Role "${roleName}" nebyla nalezena.`);

            const member = message.member;
            if (member.roles.cache.has(role.id)) {
                await member.roles.remove(role);
                await message.channel.send(`Role ${role.name} byla odebrána.`);
                console.log(`Rola ${role.name} odstránená`);
            } else {
                await member.roles.add(role);
                await message.channel.send(`Role ${role.name} byla přidána.`);
                console.log(`Rola ${role.name} pridaná`);
            }
        } catch (error) {
            console.error('Chyba pri príkaze /role:', error);
        }
    }
});

// Logovanie pripojenia a odpojenia
client.on('error', (error) => {
    console.error('Chyba pripojenia:', error);
});

client.on('disconnect', () => {
    console.log('Bot bol odpojený, pokúšam sa znovu pripojiť...');
    client.login(BOT_TOKEN).catch(err => console.error('Nepodarilo sa znovu pripojiť:', err));
});

client.login(BOT_TOKEN).catch(error => {
    console.error('Chyba pri prihlásení bota:', error);
});