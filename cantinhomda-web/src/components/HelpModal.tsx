import { useState } from 'react';
import { ROLE_TRANSLATIONS } from '../pages/members/types';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/axios';
import { useAuth } from '../contexts/AuthContext';
import {
    ChevronDown, ChevronUp, Search, HelpCircle, FileText,
    Shield, Users, GraduationCap, Heart
} from 'lucide-react';
import { Modal } from './Modal';

interface FAQ {
    id: string;
    question: string;
    answer: string;
    category: string;
    isVisible: boolean;
}

// --- CONTENT DEFINITIONS ---

// 1. Guides by Role (Contextual Help)
// Maps specific roles to the menu items they can see and how to use them.

const ADMIN_GUIDE = [
    {
        category: 'GESTÃO ADMINISTRATIVA',
        items: [
            {
                title: 'Painel Principal (Dashboard)',
                desc: 'Central de comando do seu clube com visão 360° de todas as atividades.',
                steps: [
                    '📊 Ao acessar, você verá estatísticas em tempo real: total de membros ativos, aniversariantes do mês, saldo financeiro atual e próximos eventos.',
                    '🎯 Use o widget "Indique e Ganhe" para copiar seu link de referência exclusivo e compartilhar com outros clubes.',
                    '📈 Monitore o gráfico de frequência mensal para identificar tendências de queda na participação e agir preventivamente.',
                    '📅 Verifique o card de "Próximo Evento" para não perder prazos de inscrição em eventos regionais.',
                    '🔔 O sistema destaca automaticamente membros com pendências (fichas médicas vencidas, mensalidades atrasadas).',
                    '💡 Dica: Acesse o Dashboard toda semana antes da reunião para ter um panorama completo da situação do clube.'
                ]
            },
            {
                title: 'Secretaria & Atas',
                desc: 'Gestão completa de documentos oficiais, reuniões de comissão e registro de decisões.',
                steps: [
                    '📋 Acesse o menu "Secretaria" > Aba "Atas" para gerenciar todas as atas de reuniões.',
                    '➕ Clique em "Nova Ata" para registrar uma reunião da D.A. (Diretoria Administrativa) ou da Comissão Executiva.',
                    '✅ Registre os membros presentes marcando cada um na lista de presença.',
                    '📝 Adicione os votos/decisões tomados usando o formato: "Votado e aprovado que..." seguido da decisão.',
                    '🔢 O sistema gera automaticamente um número sequencial único para cada ata (ex: ATA-2026-001).',
                    '🖨️ Use o botão "Imprimir" para gerar o documento oficial em PDF para assinatura física.',
                    '👥 Na aba "Membros", monitore quem está com ficha médica ou cadastro pendente (indicador vermelho).',
                    '⚠️ Importante: Atas são documentos legais. Não edite atas após aprovação sem registrar a correção em nova ata.'
                ]
            },
            {
                title: 'Gestão de Unidades',
                desc: 'Organização das micro-equipes do clube com controle de conselheiros e capitães.',
                steps: [
                    '🏕️ No menu "Unidades", visualize todas as unidades do clube organizadas por gênero.',
                    '➕ Crie novas unidades clicando em "Nova Unidade" e escolhendo Masculina ou Feminina.',
                    '👨‍🏫 Defina os Conselheiros responsáveis por cada unidade (podem ser mais de um).',
                    '🎖️ Nomeie Capitães e Vice-Capitães que são os líderes desbravadores da unidade.',
                    '🔄 Use a interface de "arrastar e soltar" para mover desbravadores entre unidades facilmente.',
                    '📊 Acompanhe a pontuação de cada unidade no Ranking de Unidades (atualizado automaticamente).',
                    '🎨 Personalize cada unidade com nome criativo, grito de guerra e cores representativas.',
                    '💡 Dica: O tamanho ideal de uma unidade é entre 6 e 10 desbravadores para melhor acompanhamento.'
                ]
            },
            {
                title: 'Cadastro e Gestão de Membros',
                desc: 'Controle completo de todos os membros do clube, desde o cadastro até a baixa.',
                steps: [
                    '👤 Para cadastrar um novo membro, acesse "Membros" > "Adicionar Membro".',
                    '📧 Preencha o e-mail válido do responsável - o sistema enviará automaticamente a senha de acesso.',
                    '📋 Complete todos os campos obrigatórios: nome completo, data de nascimento, endereço e contatos.',
                    '🏥 A Ficha Médica deve ser preenchida completamente - sem ela, o membro não pode participar de acampamentos.',
                    '📸 Adicione uma foto de perfil para facilitar a identificação nas listas de presença.',
                    '🏷️ Defina o cargo/função do membro (Desbravador, Conselheiro, Instrutor, etc.).',
                    '🔄 Para transferências de outros clubes, solicite a carta de transferência e registre nas observações.',
                    '📅 O histórico completo de atividades e pontuação fica salvo no perfil de cada membro.'
                ]
            },
            {
                title: 'Eventos e Calendário',
                desc: 'Planejamento e gestão de todas as atividades do clube ao longo do ano.',
                steps: [
                    '📅 Acesse "Eventos" para ver o calendário anual de atividades.',
                    '➕ Crie novos eventos clicando em "Novo Evento" e preenchendo: título, data, local e descrição.',
                    '📍 Defina se o evento é interno (apenas seu clube) ou regional/distrital.',
                    '💰 Se houver taxa de inscrição, configure o valor e forma de pagamento.',
                    '📝 Adicione uma lista de "O que levar" para que os participantes se preparem adequadamente.',
                    '✅ Gerencie as inscrições e confirmações de presença diretamente no sistema.',
                    '📊 Após o evento, registre a presença real para atualizar as estatísticas.',
                    '🔔 O sistema envia lembretes automáticos aos membros antes de cada evento.'
                ]
            }
        ]
    },
    {
        category: 'FINANCEIRO & LOJA',
        items: [
            {
                title: 'Tesouraria - Fluxo de Caixa',
                desc: 'Controle completo de entradas e saídas financeiras do clube.',
                steps: [
                    '💰 Na aba "Caixa", você controla todo o dinheiro que entra e sai do clube.',
                    '➕ Para lançar uma ENTRADA: clique em "Nova Transação" > tipo "Entrada" > selecione a categoria.',
                    '➖ Para lançar uma SAÍDA: clique em "Nova Transação" > tipo "Saída" > anexe o comprovante se possível.',
                    '📁 Use as categorias corretas: "Mensalidades", "Ofertas", "Inscrições", "Loja", "Material", etc.',
                    '📊 O saldo é atualizado automaticamente a cada lançamento.',
                    '📈 Acompanhe o gráfico de evolução financeira para identificar meses de maior gasto.',
                    '🖨️ Gere relatórios mensais ou trimestrais para prestação de contas à igreja.',
                    '💡 Dica: Lance todas as transações no mesmo dia em que ocorrem para não perder o controle.'
                ]
            },
            {
                title: 'Mensalidades e Cobranças',
                desc: 'Gestão de mensalidades dos membros com geração automática de carnês.',
                steps: [
                    '📋 Na aba "Mensalidades", você visualiza o status de pagamento de todos os membros.',
                    '🎫 No início do ano, clique em "Gerar Carnês" para criar as mensalidades do ano inteiro.',
                    '💵 Defina o valor da mensalidade (geralmente definido pela diretoria do clube).',
                    '📱 Para cobrar, clique no ícone WhatsApp ao lado do membro para enviar mensagem automática.',
                    '📋 A mensagem já inclui: valor, chave Pix e instruções de pagamento.',
                    '✅ Ao receber pagamento em dinheiro, clique em "Dar Baixa Manual" e registre.',
                    '🔄 Pagamentos via Pix são identificados automaticamente (quando configurado).',
                    '🚫 Membros inadimplentes são automaticamente bloqueados de eventos pagos (se configurado).',
                    '📊 O sistema gera relatório de inadimplência para acompanhamento.'
                ]
            },
            {
                title: 'Loja e Vendas',
                desc: 'Controle de vendas da loja e produtos do clube.',
                steps: [
                    '🏪 Acesse a aba "Loja" para gerenciar vendas de produtos do clube.',
                    '📦 Cadastre os produtos disponíveis com nome, preço de custo e preço de venda.',
                    '🛒 Registre cada venda informando o produto, quantidade e quem comprou.',
                    '💰 O sistema calcula automaticamente o lucro de cada produto.',
                    '📊 Acompanhe o estoque e receba alertas quando produtos estiverem acabando.',
                    '📈 Gere relatórios de vendas por período e identifique os produtos mais vendidos.',
                    '💡 Dica: A loja é uma excelente fonte de renda para o clube. Planeje bem os preços!'
                ]
            }
        ]
    },
    {
        category: 'CLASSES E ESPECIALIDADES',
        items: [
            {
                title: 'Gestão de Classes',
                desc: 'Acompanhamento do progresso dos desbravadores nas classes regulares.',
                steps: [
                    '📚 Acesse "Classes" para ver todas as classes disponíveis no clube.',
                    '👥 Visualize quantos membros estão matriculados em cada classe.',
                    '📊 Acompanhe o progresso geral da turma em tempo real.',
                    '✅ Aprove ou rejeite requisitos completados pelos desbravadores.',
                    '📝 Use o "Lançamento em Lote" para aprovar requisitos para múltiplos membros de uma vez.',
                    '🎓 Quando um membro completar 100% da classe, o sistema notifica automaticamente.',
                    '📅 Planeje as aulas usando o calendário integrado de classes.',
                    '📜 Ao final, gere a lista de investidura com os nomes dos aprovados.'
                ]
            },
            {
                title: 'Especialidades',
                desc: 'Controle completo das especialidades ministradas no clube.',
                steps: [
                    '🏅 Acesse "Especialidades" para gerenciar todas as especialidades do clube.',
                    '🔍 Use a busca para encontrar especialidades por nome ou categoria.',
                    '👨‍🏫 Defina quais instrutores são responsáveis por cada especialidade.',
                    '📅 Agende as aulas de especialidades no calendário do clube.',
                    '✅ Registre a presença e aprovação dos participantes.',
                    '📜 O sistema controla automaticamente as especialidades já concluídas por cada membro.',
                    '🏆 Membros são reconhecidos no Ranking por cada especialidade concluída.',
                    '📊 Identifique quais especialidades são mais populares e planeje novas ofertas.'
                ]
            }
        ]
    },
    {
        category: 'RELATÓRIOS E CONFIGURAÇÕES',
        items: [
            {
                title: 'Relatórios Gerenciais',
                desc: 'Geração de relatórios para análise e prestação de contas.',
                steps: [
                    '📊 Acesse "Relatórios" para gerar diversos tipos de relatórios.',
                    '📋 Relatório de Membros: lista completa com dados de contato e status.',
                    '💰 Relatório Financeiro: entradas, saídas e saldo por período.',
                    '📅 Relatório de Frequência: presença nas reuniões por membro ou por período.',
                    '🏆 Relatório de Ranking: classificação detalhada com pontuação.',
                    '🎓 Relatório de Classes: progresso dos membros nas classes.',
                    '🖨️ Todos os relatórios podem ser exportados em PDF ou Excel.',
                    '📧 Configure o envio automático de relatórios mensais para a diretoria.'
                ]
            },
            {
                title: 'Configurações do Clube',
                desc: 'Personalização e ajustes do sistema para seu clube.',
                steps: [
                    '⚙️ Acesse "Configurações" para personalizar o sistema.',
                    '🎨 Adicione o logo do clube que aparecerá em todos os relatórios.',
                    '📍 Configure o endereço e horário das reuniões.',
                    '💰 Defina valores padrão de mensalidades e taxas.',
                    '🔔 Configure notificações automáticas (WhatsApp, e-mail).',
                    '👥 Gerencie os usuários administradores do sistema.',
                    '🔒 Configure as permissões de acesso para cada cargo.',
                    '📅 Defina o calendário de eventos fixos do ano (acampamentos, investiduras, etc.).'
                ]
            }
        ]
    }
];

const COUNSELOR_GUIDE = [
    {
        category: 'MINHA UNIDADE',
        items: [
            {
                title: 'Gestão da Unidade',
                desc: 'Acompanhamento completo dos seus desbravadores e organização da equipe.',
                steps: [
                    '🏕️ Acesse o menu "Minha Unidade" para ver todos os desbravadores sob sua responsabilidade.',
                    '✅ Verifique se todos estão com "Seguro Ativo" - sem isso, não podem participar de acampamentos.',
                    '📋 Confira se as Fichas Médicas estão completas e atualizadas (data de validade).',
                    '🎨 Use o "Cantinho da Unidade" para definir: nome, grito de guerra, cores e foto da equipe.',
                    '🏆 Monitore o "Ranking da Unidade" semanalmente para motivar seus liderados.',
                    '📱 Use os contatos dos pais para comunicação rápida via WhatsApp.',
                    '📊 Acompanhe o progresso individual de cada membro nas Classes e Especialidades.',
                    '💡 Dica: Faça reuniões de unidade de 10-15min antes do programa geral para alinhar expectativas.'
                ]
            },
            {
                title: 'Chamada e Inspeção',
                desc: 'Registro semanal obrigatório de presença e avaliação de uniforme.',
                steps: [
                    '📋 No menu "Chamada", selecione a reunião do dia atual.',
                    '✅ Marque "Presente" para cada membro que compareceu no horário.',
                    '❌ Para faltas, marque "Falta" e entre em contato com os pais IMEDIATAMENTE para saber o motivo.',
                    '📊 A frequência impacta diretamente a pontuação no Ranking.',
                    '👕 Realize a "Inspeção de Uniforme" verificando: lenço, nó correto, cinto, camisa, calça/saia, sapatos engraxados.',
                    '📖 Verifique também se trouxeram: Bíblia, hinário, Manual AE/DBV e caderno.',
                    '⭐ Dê pontos extras para uniformes impecáveis e atitude exemplar.',
                    '📝 Registre observações importantes (membro doente, uniforme em reforma, etc.).',
                    '💡 Dica: Seja justo e consistente na inspeção. Isso ensina disciplina e organização.'
                ]
            },
            {
                title: 'Aprovação de Requisitos',
                desc: 'Validar o progresso dos desbravadores nas classes e especialidades.',
                steps: [
                    '🔔 Verifique regularmente o menu "Solicitações" para ver requisitos pendentes de aprovação.',
                    '👆 Você também pode acessar diretamente o perfil de cada desbravador.',
                    '📝 Quando um desbravador marca que completou um requisito (ex: "Decorar o Voto"), você deve TESTÁ-LO.',
                    '✅ Se demonstrou corretamente, clique em "Aprovar" - isso libera a próxima etapa.',
                    '❌ Se não passou, clique em "Rejeitar" e deixe um comentário explicando o que falta.',
                    '📋 Para requisitos escritos (relatórios), leia o conteúdo antes de aprovar.',
                    '🎯 Para requisitos práticos (nós, fogueiras, etc.), peça demonstração presencial.',
                    '⚠️ NUNCA aprove requisitos sem verificar. Isso prejudica a formação do desbravador.',
                    '💡 Dica: Use os momentos de Cantinho de Unidade para tomar requisitos individuais.'
                ]
            },
            {
                title: 'Acompanhamento Pastoral',
                desc: 'O cuidado espiritual e emocional de cada membro da sua unidade.',
                steps: [
                    '❤️ Conheça cada desbravador pelo nome, história familiar e desafios pessoais.',
                    '🙏 Reserve um momento para oração individual ou em grupo em cada reunião.',
                    '📱 Mantenha contato durante a semana - uma mensagem de incentivo faz diferença.',
                    '👨‍👩‍👧 Visite as famílias quando possível, especialmente em aniversários ou dificuldades.',
                    '📅 Acompanhe quem está faltando muito e descubra o motivo antes que desistam.',
                    '🎂 Lembre dos aniversários - o sistema mostra os aniversariantes do mês.',
                    '💡 Dica: O conselheiro não é apenas um "professor", mas um mentor e amigo.'
                ]
            }
        ]
    },
    {
        category: 'EVENTOS E ATIVIDADES',
        items: [
            {
                title: 'Preparação para Acampamentos',
                desc: 'Tudo que você precisa fazer antes, durante e depois de um acampamento.',
                steps: [
                    '📋 Verifique se TODOS os membros da sua unidade têm autorização assinada.',
                    '🏥 Confirme que todas as Fichas Médicas estão atualizadas (vacinas, alergias, remédios).',
                    '💊 Prepare uma bolsa com medicamentos essenciais e leve a lista de alergias impressa.',
                    '🎒 Verifique a lista de itens obrigatórios com cada membro antes de sair.',
                    '🏕️ No acampamento, você é responsável por: segurança, higiene e disciplina da unidade.',
                    '📱 Mantenha contato com os pais em caso de emergência.',
                    '📊 Após o evento, registre a participação de cada membro no sistema.',
                    '💡 Dica: Faça uma reunião de unidade pré-acampamento para alinhar regras e expectativas.'
                ]
            }
        ]
    }
];

const INSTRUCTOR_GUIDE = [
    {
        category: 'CLASSES REGULARES',
        items: [
            {
                title: 'Ministrar Classes',
                desc: 'Gerenciamento completo do currículo progressivo de classes.',
                steps: [
                    '📚 Acesse o menu "Classes" para ver todas as classes que você leciona.',
                    '👥 Selecione a Classe específica (ex: Amigo, Companheiro, Pesquisador, etc.).',
                    '📋 Visualize a lista de alunos matriculados e o progresso de cada um.',
                    '📝 Use a função "Aula do Dia" para registrar tópicos ensinados e atividades realizadas.',
                    '✅ Marque presença dos alunos em cada aula ministrada.',
                    '📊 Utilize o "Lançamento em Lote" para aprovar requisitos de toda a turma de uma vez.',
                    '⚠️ Monitore alunos com progresso atrasado usando o gráfico de acompanhamento.',
                    '📅 Planeje suas aulas com antecedência usando o calendário integrado.',
                    '💡 Dica: Varie os métodos de ensino - não apenas leitura, mas atividades práticas!'
                ]
            },
            {
                title: 'Avaliações e Provas',
                desc: 'Como avaliar e aprovar os requisitos dos alunos.',
                steps: [
                    '📝 Prepare avaliações práticas e teóricas para cada seção da classe.',
                    '✏️ Use o sistema de Quizzes para criar provas online que auto-corrigem.',
                    '📊 Acompanhe o resultado de cada aluno e identifique quem precisa de reforço.',
                    '✅ Após a avaliação, aprove em lote os requisitos para quem passou.',
                    '🔄 Para quem não passou, agende recuperação e registre no sistema.',
                    '📋 Mantenha evidências das avaliações (fotos de trabalhos, áudios de recitação, etc.).',
                    '💡 Dica: Combine com outros instrutores para não haver sobrecarga de avaliações.'
                ]
            },
            {
                title: 'Materiais Didáticos',
                desc: 'Onde encontrar e como usar os materiais oficiais.',
                steps: [
                    '📖 Acesse a seção "Materiais" dentro de cada classe para recursos disponíveis.',
                    '📥 Baixe PDFs, apresentações PowerPoint e vídeos oficiais da Divisão.',
                    '🎥 Utilize os recursos multimídia para tornar as aulas mais dinâmicas.',
                    '📋 Siga o currículo oficial, mas adapte a linguagem para a realidade local.',
                    '🔗 Compartilhe materiais adicionais diretamente com os alunos pelo sistema.',
                    '💡 Dica: Crie uma pasta digital com seus próprios materiais para reutilizar no futuro.'
                ]
            }
        ]
    },
    {
        category: 'ESPECIALIDADES',
        items: [
            {
                title: 'Ministrar Especialidades',
                desc: 'Como ensinar e avaliar especialidades do clube.',
                steps: [
                    '🏅 Acesse "Especialidades" e selecione a que você ministra.',
                    '📋 Verifique os requisitos oficiais da especialidade no cartão da Divisão.',
                    '📅 Agende as aulas da especialidade no calendário do clube.',
                    '👥 Registre os participantes inscritos na especialidade.',
                    '✅ À medida que os requisitos são cumpridos, marque no sistema.',
                    '📝 Para requisitos práticos, exija demonstração; para teóricos, aplique prova.',
                    '🏆 Ao concluir, aprove a especialidade e ela aparecerá automaticamente no perfil do membro.',
                    '📸 Tire fotos das atividades práticas como evidência e memória.',
                    '💡 Dica: Especialidades práticas são mais memoráveis que apenas teoria!'
                ]
            },
            {
                title: 'Eventos de Especialidades',
                desc: 'Organização de dias especiais focados em especialidades.',
                steps: [
                    '📅 Organize "Sábados de Especialidades" dedicados a uma área específica.',
                    '👨‍🏫 Convide especialistas externos para ministrar especialidades técnicas.',
                    '🏕️ Aproveite acampamentos para trabalhar especialidades de campismo.',
                    '📋 Planeje os materiais e equipamentos necessários com antecedência.',
                    '📊 Registre todas as especialidades concluídas em cada evento no sistema.',
                    '💡 Dica: Agrupe especialidades relacionadas para melhor aproveitamento de tempo.'
                ]
            }
        ]
    }
];

const PATHFINDER_GUIDE = [
    {
        category: 'MEU PROGRESSO',
        items: [
            {
                title: 'Ranking & Pontos',
                desc: 'Entenda como funciona a pontuação e como subir no ranking.',
                steps: [
                    '🏆 No menu "Ranking", veja sua posição atual no clube.',
                    '📊 Acompanhe quantos pontos você tem e quantos faltam para o próximo colocado.',
                    '✅ Ganhe pontos por: Presença (10pts), Uniforme Completo (até 20pts), Trazer Bíblia (5pts).',
                    '📚 Complete requisitos de Classes para ganhar 5 pontos por item aprovado.',
                    '🏅 Especialidades concluídas dão 10 pontos cada.',
                    '⭐ Pontos extras podem ser dados por comportamento exemplar e participação em eventos.',
                    '📅 Mantenha frequência alta - faltas não dão pontos e podem reduzir sua média.',
                    '💡 Dica: Não é sobre competir com os outros, mas sobre ser o melhor que você pode ser!'
                ]
            },
            {
                title: 'Caderno Virtual (Requisitos)',
                desc: 'Como marcar e acompanhar seus requisitos de classe.',
                steps: [
                    '📖 Acesse "Meus Requisitos" para ver todos os itens da sua classe atual.',
                    '📋 Leia com atenção o que cada requisito pede (alguns exigem memorização, outros prática).',
                    '✏️ Quando você completar um requisito em casa ou nas aulas, marque a caixinha "Concluído".',
                    '⏳ Aguarde seu Conselheiro verificar e aprovar - ele pode te chamar para demonstrar.',
                    '✅ Quando aprovado, o requisito fica verde e a barra de progresso avança.',
                    '❌ Se for rejeitado, leia o comentário do conselheiro e tente novamente.',
                    '📊 Acompanhe o percentual de conclusão da sua classe no seu perfil.',
                    '💡 Dica: Estude um pouco todos os dias, não deixe tudo para a última hora!'
                ]
            },
            {
                title: 'Minhas Especialidades',
                desc: 'Veja e conquiste novas especialidades.',
                steps: [
                    '🏅 Acesse "Especialidades" para ver todas as disponíveis.',
                    '⭐ Veja quais você já conquistou - elas aparecem em destaque no seu perfil.',
                    '🎯 Escolha novas especialidades que te interessam e peça ao instrutor para abrir turma.',
                    '📚 Cada especialidade tem requisitos específicos - cumpra todos para ser aprovado.',
                    '🏆 Quanto mais especialidades, mais pontos e mais insígnias para sua faixa!',
                    '💡 Dica: Explore áreas diferentes - você pode descobrir novos talentos!'
                ]
            }
        ]
    },
    {
        category: 'MINHA UNIDADE',
        items: [
            {
                title: 'Vida de Unidade',
                desc: 'Como participar ativamente da sua unidade.',
                steps: [
                    '🏕️ Sua unidade é sua equipe - trabalhem juntos para conquistar pontos.',
                    '📊 Acompanhe o Ranking de Unidades - vejam a posição da equipe.',
                    '🗣️ Pratiquem juntos o grito de guerra e ordem unida.',
                    '👥 Ajude os colegas mais novos a entenderem os requisitos.',
                    '✅ Quando todos da unidade estão de uniforme completo, a pontuação é maior.',
                    '🎯 Definam metas: "Este mês, todos vão completar 3 requisitos!"',
                    '💡 Dica: O espírito de equipe é mais importante que vitórias individuais.'
                ]
            },
            {
                title: 'Eventos e Acampamentos',
                desc: 'Como se preparar e aproveitar ao máximo.',
                steps: [
                    '📅 Veja os próximos eventos no calendário do clube.',
                    '📋 Leia o "O que levar" e prepare sua mochila com antecedência.',
                    '✍️ Peça seus pais para assinar a autorização no sistema.',
                    '🏥 Certifique-se que sua Ficha Médica está atualizada.',
                    '💰 Verifique se sua mensalidade está em dia (pode bloquear inscrição).',
                    '🏆 Participe ativamente das atividades para ganhar pontos extras.',
                    '📸 Registre momentos especiais para compartilhar depois.',
                    '💡 Dica: Acampamentos são onde se formam as melhores amizades!'
                ]
            }
        ]
    }
];

const PARENT_GUIDE = [
    {
        category: 'ACOMPANHAMENTO DO FILHO',
        items: [
            {
                title: 'Dashboard do Responsável',
                desc: 'Visão geral da situação do seu filho no clube.',
                steps: [
                    '📊 No painel principal, veja o resumo completo da situação do seu filho.',
                    '🏆 Acompanhe a posição no Ranking e a evolução semanal.',
                    '📚 Verifique o progresso nas Classes - quantos requisitos faltam para investidura.',
                    '📅 Veja os próximos eventos e datas importantes.',
                    '✅ Monitore a frequência - faltas frequentes indicam possível desinteresse.',
                    '💰 Verifique se há mensalidades em aberto.',
                    '💡 Dica: Acompanhe junto com seu filho - isso motiva e cria conexão.'
                ]
            },
            {
                title: 'Progresso nas Classes',
                desc: 'Entenda o que seu filho está aprendendo.',
                steps: [
                    '📖 Acesse o perfil do seu filho para ver a classe atual.',
                    '📋 Veja a lista de requisitos e o que cada um exige.',
                    '✅ Requisitos aprovados ficam verdes - incentive a completar os pendentes.',
                    '📚 Requisitos como "Ler o livro do ano" precisam de incentivo em casa.',
                    '🙏 Auxilie nos requisitos espirituais: orar em público, estudo bíblico, etc.',
                    '✏️ Ajude com requisitos de escrita quando solicitado.',
                    '🏆 Celebre cada conquista - a jornada é tão importante quanto o destino.',
                    '💡 Dica: Pergunte "O que você aprendeu no clube hoje?" toda semana.'
                ]
            },
            {
                title: 'Especialidades',
                desc: 'Como as especialidades funcionam e como ajudar.',
                steps: [
                    '🏅 Especialidades são "matérias extras" que desenvolvem habilidades específicas.',
                    '📋 Cada especialidade tem requisitos próprios - algumas podem ser feitas em casa.',
                    '👨‍🍳 Especialidades como Culinária, Arte Culinária, podem ser praticadas em família.',
                    '📖 Especialidades de leitura (ex: Vida de Jesus) precisam de acompanhamento.',
                    '🎨 Auxilie na coleta de materiais para especialidades práticas.',
                    '📸 Tire fotos das atividades feitas em casa para comprovar.',
                    '💡 Dica: Fazer especialidades juntos é uma excelente atividade em família!'
                ]
            }
        ]
    },
    {
        category: 'FINANCEIRO',
        items: [
            {
                title: 'Mensalidades e Pagamentos',
                desc: 'Como manter as mensalidades em dia.',
                steps: [
                    '💰 No painel, veja o resumo de "Mensalidades em Aberto" do seu filho.',
                    '📋 Clique para ver o histórico completo de pagamentos.',
                    '📲 Copie a chave Pix ou código de barras para realizar o pagamento.',
                    '✅ Pagamentos via Pix são identificados automaticamente em até 24h.',
                    '💵 Se pagar em dinheiro, informe o tesoureiro para dar baixa manual.',
                    '🧾 O comprovante fica salvo no sistema para sua consulta futura.',
                    '⚠️ Mensalidades atrasadas podem bloquear inscrição em eventos pagos.',
                    '💡 Dica: Configure lembretes no seu celular para não esquecer o vencimento.'
                ]
            },
            {
                title: 'Taxas de Eventos',
                desc: 'Como pagar inscrições em acampamentos e eventos.',
                steps: [
                    '📅 Quando houver um evento pago, você será notificado no sistema.',
                    '💰 Veja o valor da taxa e a data limite de pagamento.',
                    '📲 O pagamento segue o mesmo processo das mensalidades (Pix).',
                    '✅ Após confirmação, seu filho estará inscrito automaticamente.',
                    '📋 Você pode parcelar o valor em acordo com a tesouraria (combinar pessoalmente).',
                    '💡 Dica: Pague antecipadamente para garantir a vaga em eventos limitados.'
                ]
            }
        ]
    },
    {
        category: 'AUTORIZAÇÕES E DOCUMENTOS',
        items: [
            {
                title: 'Ficha Médica',
                desc: 'Documento obrigatório para participação em atividades.',
                steps: [
                    '🏥 A Ficha Médica é OBRIGATÓRIA - sem ela, seu filho não pode acampar.',
                    '📋 Acesse "Ficha Médica" no perfil do seu filho para preencher.',
                    '💉 Informe: tipo sanguíneo, vacinas em dia, alergias, medicamentos de uso contínuo.',
                    '🏥 Adicione plano de saúde (se tiver) e contatos de emergência.',
                    '📆 A ficha tem validade de 1 ano - o sistema avisa quando precisa renovar.',
                    '⚠️ Qualquer alteração de saúde deve ser atualizada imediatamente.',
                    '💡 Dica: Tenha sempre uma cópia da ficha no celular para emergências.'
                ]
            },
            {
                title: 'Autorizações para Eventos',
                desc: 'Como autorizar a participação em acampamentos e saídas.',
                steps: [
                    '📝 Para cada evento externo, você precisa assinar uma autorização.',
                    '📲 O sistema envia notificação quando há autorização pendente.',
                    '✅ Acesse o evento, leia as informações e clique em "Autorizar Participação".',
                    '✍️ Sua assinatura digital fica registrada com data e hora.',
                    '📋 Autorize também o uso de imagem em fotos do evento.',
                    '⚠️ Sem autorização, seu filho NÃO poderá participar do evento.',
                    '💡 Dica: Leia sempre a lista "O que levar" na mesma página da autorização.'
                ]
            },
            {
                title: 'Calendário e Comunicação',
                desc: 'Como ficar informado sobre as atividades do clube.',
                steps: [
                    '📅 Acesse o "Calendário" para ver todos os eventos do ano.',
                    '🔔 Ative as notificações para receber lembretes de eventos.',
                    '📱 O clube pode enviar comunicados pelo sistema - verifique regularmente.',
                    '💬 Use o chat do sistema para tirar dúvidas com a diretoria.',
                    '🏕️ Eventos importantes: Acampamentos, Investiduras, Camporis, Dia de Aventureiro.',
                    '📋 Planeje férias e viagens verificando o calendário do clube.',
                    '💡 Dica: Adicione os eventos do clube ao calendário do seu celular.'
                ]
            }
        ]
    }
];

// 2. Manuals Library (Public to All)
// Full text manuals for deep reading.

const MANUALS_LIBRARY = [
    {
        id: 'admin',
        title: 'Manual Administrativo',
        icon: Shield,
        color: 'text-blue-600 bg-blue-50',
        description: 'Guia completo para Diretores, Vice-Diretores e Secretários sobre a gestão do clube no sistema.',
        content: `
# Manual Administrativo do Sistema CantinhoMDA

## 1. Introdução ao Sistema

O CantinhoMDA foi desenvolvido para ser a central de gestão completa do seu Clube de Desbravadores ou Aventureiros. Este manual irá guiá-lo pelas principais funcionalidades administrativas.

### 1.1 Primeiro Acesso
- Ao receber suas credenciais, acesse o sistema pelo navegador (preferencialmente Chrome ou Firefox).
- Na primeira vez, você será orientado a alterar sua senha.
- Complete seu perfil com foto e dados de contato.

### 1.2 Níveis de Acesso
O sistema possui os seguintes níveis de acesso:
- **OWNER**: Acesso total ao sistema, incluindo configurações avançadas e dados sensíveis.
- **MASTER**: Acesso administrativo regional/distrital para supervisão de múltiplos clubes.
- **DIRECTOR/ADMIN**: Gestão completa do clube, incluindo financeiro e membros.
- **SECRETARY**: Gestão de documentos, atas e cadastros.
- **TREASURER**: Acesso ao módulo financeiro (caixa, mensalidades, relatórios).
- **COUNSELOR**: Gestão da unidade e aprovação de requisitos.
- **INSTRUCTOR**: Gestão de classes e especialidades.
- **PARENT**: Acompanhamento do(s) filho(s) e pagamentos.
- **PATHFINDER/ADVENTURER**: Acesso ao próprio perfil e requisitos.

## 2. Cadastro e Gestão de Membros

### 2.1 Cadastrando Novos Membros
1. Acesse o menu "Membros" > "Adicionar Membro".
2. Preencha todos os campos obrigatórios (indicados com *).
3. O e-mail informado será usado para login - certifique-se de que está correto.
4. O sistema enviará automaticamente um e-mail com a senha temporária.
5. Para menores de idade, cadastre o e-mail do responsável.

### 2.2 Ficha Médica
A Ficha Médica é um documento LEGAL e OBRIGATÓRIO:
- Todo membro precisa ter a ficha completa para participar de atividades externas.
- Informações obrigatórias: tipo sanguíneo, alergias, vacinas, medicamentos de uso contínuo.
- O sistema indica visualmente fichas incompletas ou vencidas (validade de 1 ano).
- Em acampamentos, a diretoria deve ter acesso rápido às fichas em caso de emergência.

### 2.3 Transferências
Ao receber um membro de outro clube:
1. Solicite a Carta de Transferência oficial assinada pelo antigo diretor.
2. No cadastro, selecione "Membro Transferido" e preencha os dados do clube de origem.
3. Registre nas observações qualquer classe ou especialidade já concluída.
4. O histórico de pontuação recomeça do zero no novo clube.

## 3. Gestão Financeira

### 3.1 Fluxo de Caixa
O módulo de Tesouraria centraliza toda a movimentação financeira:
- **Entradas**: Mensalidades, ofertas, doações, venda de produtos, inscrições em eventos.
- **Saídas**: Compras de materiais, lanches, uniformes, taxas de eventos, manutenção.
- Para toda saída, anexe o comprovante (foto da nota fiscal ou recibo).
- O saldo é calculado automaticamente em tempo real.

### 3.2 Mensalidades
- No início do ano, acesse "Mensalidades" > "Gerar Carnês" para criar as parcelas de todos os membros.
- Defina: valor, data de vencimento, possibilidade de desconto por pontualidade.
- Para cobrar, use o botão WhatsApp que envia mensagem automática com valor e chave Pix.
- Baixas podem ser manuais (para pagamentos em dinheiro) ou automáticas (Pix identificado).

### 3.3 Relatórios Financeiros
- Gere relatórios mensais para apresentar na D.A. (Diretoria Administrativa).
- Relatórios trimestrais são exigidos pela Igreja para prestação de contas.
- O sistema permite exportar em PDF ou Excel.
- Guarde todos os relatórios - eles são documentos oficiais do clube.

## 4. Sistema de Ranking

### 4.1 Como Funciona
O ranking é uma ferramenta de MOTIVAÇÃO, não de competição negativa:
- A pontuação é calculada automaticamente toda madrugada (00:00).
- Membros ganham pontos por: presença, uniforme, requisitos, comportamento e participação em eventos.
- O ranking é zerado a cada ano para dar chances iguais a todos.

### 4.2 Critérios de Pontuação
- **Presença**: 10 pontos por reunião frequentada.
- **Uniforme Completo**: Até 20 pontos (5 pts cada item: lenço, cinto, sapatos, bíblia).
- **Requisitos**: 5 pontos por requisito aprovado.
- **Especialidades**: 10 pontos por especialidade concluída.
- **Eventos**: Pontuação extra definida pela diretoria.

### 4.3 Fair Play
- NUNCA altere pontos manualmente sem justificativa registrada em ata.
- Todos os membros devem ter as mesmas oportunidades de ganhar pontos.
- Use o ranking para INCENTIVAR, nunca para humilhar quem está com menos pontos.

## 5. Eventos e Calendário

### 5.1 Criando Eventos
1. Acesse "Eventos" > "Novo Evento".
2. Defina: título, data/hora, local, descrição e se haverá taxa de inscrição.
3. Adicione a lista "O que levar" para orientar os participantes.
4. Eventos podem ser internos (apenas seu clube) ou regionais/distritais.

### 5.2 Gestão de Inscrições
- O sistema controla automaticamente quem confirmou presença.
- Para eventos pagos, membros inadimplentes podem ser bloqueados automaticamente.
- Gere a lista de inscritos para controle de transporte e alimentação.

### 5.3 Após o Evento
- Registre a presença real (quem efetivamente participou).
- Atribua pontos extras conforme as regras do clube.
- Anexe fotos e memórias do evento (opcional).

## 6. Secretaria e Documentos

### 6.1 Registro de Atas
- Toda reunião oficial da D.A. deve ter ata registrada.
- O sistema numera automaticamente (ATA-ANO-NÚMERO).
- Registre: data, presentes, pauta, votos/decisões.
- Imprima para assinatura física dos presentes.

### 6.2 Documentos Importantes
- Mantenha digitalizados: Estatuto do Clube, Regulamento Interno, Lista de Patrimônio.
- Use a seção "Documentos" para armazenar arquivos importantes.
- Backups são feitos automaticamente pelo sistema.
        `
    },
    {
        id: 'counselor',
        title: 'Manual do Conselheiro',
        icon: Users,
        color: 'text-orange-600 bg-orange-50',
        description: 'Tudo o que o conselheiro precisa saber para liderar sua unidade e avaliar requisitos.',
        content: `
# Manual do Conselheiro

## 1. O Papel do Conselheiro

Você é o coração da unidade! Mais do que um líder técnico, você é um mentor espiritual e amigo de cada desbravador sob sua responsabilidade. No sistema, sua função é garantir que os dados reflitam fielmente o progresso de cada membro.

### 1.1 Suas Responsabilidades
- Conhecer pessoalmente cada membro da sua unidade.
- Manter contato semanal com os pais/responsáveis.
- Registrar presença e inspeção em todas as reuniões.
- Avaliar e aprovar requisitos de classes e especialidades.
- Ser exemplo de caráter cristão e cidadania.

### 1.2 Cuidado Pastoral
O conselheiro ideal:
- Ora por cada membro diariamente.
- Visita famílias quando possível.
- Lembra de aniversários e datas especiais.
- Está atento a mudanças de comportamento.
- Acompanha quem está faltando e busca saber o motivo.

## 2. Rotina de Reunião

### 2.1 Chegada (15 minutos antes)
- Abra o sistema e vá em "Chamada".
- Selecione a reunião do dia.
- Tenha a lista da sua unidade pronta.

### 2.2 Chamada e Inspeção
1. À medida que os membros chegam, marque "Presente" no sistema.
2. Realize a inspeção de uniforme verificando:
   - Lenço com nó correto
   - Camisa oficial limpa e passada
   - Cinto na posição correta
   - Calça/saia oficial
   - Sapato engraxado
   - Bíblia e/ou hinário
   - Manual de Classes (quando aplicável)
3. Dê a pontuação correspondente a cada item.
4. Anote observações importantes (membro doente, uniforme em reforma, etc.).

### 2.3 Cantinho de Unidade
Este é seu momento mais precioso! Use para:
- Fazer a oração de abertura com a unidade.
- Verificar lições da semana.
- Tomar requisitos de memorização (Voto, Lei, etc.).
- Conversar sobre as dificuldades da semana.
- Motivar para os desafios do clube.

### 2.4 Durante o Programa
- Mantenha sua unidade organizada e atenta.
- Corrija comportamentos inadequados com amor, mas firmeza.
- Incentive a participação ativa em todas as atividades.

### 2.5 Ao Final
- Faça a oração de encerramento com a unidade.
- Confirme se todos os pais vieram buscar.
- Verifique se ninguém esqueceu pertences.

## 3. Avaliação de Requisitos

### 3.1 Princípios Básicos
- NUNCA aprove um requisito sem verificar se foi realmente cumprido.
- Você é o filtro de qualidade do clube.
- Requisitos mal avaliados prejudicam a formação do desbravador.

### 3.2 Tipos de Requisitos

**Memorização** (Voto, Lei, Lema, etc.)
- O desbravador deve recitar SEM AJUDA.
- Pequenos erros podem ser tolerados se o sentido for mantido.
- Peça que explique o significado com suas próprias palavras.

**Demonstração Prática** (Nós, Fogueira, Primeiros Socorros, etc.)
- O desbravador deve fazer na sua frente, do início ao fim.
- Tempo máximo pode ser definido conforme o requisito.
- Erros graves reprovam; erros leves pedem repetição.

**Relatórios e Trabalhos Escritos**
- Leia o texto completamente.
- Verifique se atende ao que foi pedido.
- Para menores, considere nível de escolaridade.
- Relatórios copiados da internet são REPROVADOS.

**Atividades Práticas** (Acampar, Cozinhar, etc.)
- Você deve presenciar a atividade ou receber evidência.
- Fotos e vídeos são aceitos como comprovação.
- Atividades em casa precisam de confirmação dos pais.

### 3.3 No Sistema
- Acesse "Solicitações" para ver requisitos pendentes.
- Ou vá diretamente no perfil do desbravador.
- Clique em "Aprovar" ou "Rejeitar".
- Em caso de rejeição, SEMPRE deixe comentário explicando.

## 4. Preparação para Eventos

### 4.1 Antes do Acampamento
- Verifique se TODOS têm autorização assinada no sistema.
- Confira as Fichas Médicas (validade, alergias, medicamentos).
- Faça reunião com pais para alinhar expectativas.
- Prepare lista de materiais e verifique com cada membro.

### 4.2 Durante o Acampamento
- Você é responsável pela segurança da sua unidade 24h.
- Mantenha todos sempre visíveis.
- Aplique as regras do clube com firmeza e amor.
- Em caso de emergência, tenha as fichas médicas impressas.

### 4.3 Após o Evento
- Registre a participação de cada membro no sistema.
- Atribua pontos extras quando aplicável.
- Agradeça aos pais pela confiança.

## 5. Comunicação com Pais

### 5.1 Grupo de WhatsApp
- Mantenha grupo apenas para informações principais.
- Evite conversas paralelas no grupo.
- Responda dúvidas prontamente.

### 5.2 Assuntos Sensíveis
- Problemas de comportamento: converse em particular, nunca no grupo.
- Questões financeiras: encaminhe para a tesouraria.
- Dúvidas sobre requisitos: explique com paciência.

### 5.3 Feedback Regular
- Informe aos pais o progresso dos filhos.
- Celebre conquistas (requisitos aprovados, bom comportamento).
- Alerte sobre faltas excessivas ou quedas de rendimento.
        `
    },
    {
        id: 'instructor',
        title: 'Manual do Instrutor',
        icon: GraduationCap,
        color: 'text-purple-600 bg-purple-50',
        description: 'Diretrizes completas para o ensino de classes regulares e especialidades.',
        content: `
# Manual do Instrutor de Classes e Especialidades

## 1. O Papel do Instrutor

O instrutor é responsável pelo ensino formal das Classes Regulares (Amigo, Companheiro, Pesquisador, etc.) e das Especialidades. Seu papel é garantir que o conteúdo seja transmitido de forma clara, prática e memorável.

### 1.1 Suas Responsabilidades
- Conhecer profundamente o conteúdo que leciona.
- Preparar aulas dinâmicas e interativas.
- Avaliar o aprendizado de forma justa.
- Manter registros atualizados no sistema.
- Estar disponível para tirar dúvidas.

## 2. Ensinando Classes Regulares

### 2.1 Estrutura das Classes
Cada classe (Amigo, Companheiro, etc.) possui seções:
- **Geral**: Requisitos básicos (Voto, Lei, Especialidades obrigatórias).
- **Descoberta Espiritual**: Estudo bíblico, devocional, testemunho.
- **Servindo a Outros**: Projetos comunitários e serviço.
- **Desenvolvendo Amizade**: Relacionamento e comunicação.
- **Saúde e Aptidão Física**: Atividades físicas e hábitos saudáveis.
- **Organização e Liderança**: Habilidades de liderança (classes avançadas).
- **Estudo da Natureza**: Especialidades em natureza.
- **Arte de Acampar**: Habilidades de vida ao ar livre.

### 2.2 Planejamento Anual
1. No início do ano, faça o planejamento de todas as aulas.
2. Distribua os requisitos ao longo dos meses disponíveis.
3. Considere feriados, campori e outros eventos.
4. Reserve tempo para revisões e avaliações.
5. Cadastre o cronograma no sistema.

### 2.3 Metodologia de Ensino
Varie os métodos para manter o interesse:
- **Exposição**: Breve explicação teórica (máximo 15 minutos).
- **Demonstração**: Mostre como fazer antes de pedir que façam.
- **Prática**: Deixe que experimentem (a maior parte do tempo).
- **Discussão**: Perguntas e respostas em grupo.
- **Jogos**: Atividades lúdicas que reforcem o conteúdo.
- **Pesquisa**: Trabalhos para fazer em casa ou em grupos.

### 2.4 Registro no Sistema
- Após cada aula, registre o conteúdo ensinado.
- Marque quais requisitos foram trabalhados.
- Anote observações sobre alunos com dificuldade.

## 3. Ensinando Especialidades

### 3.1 Estrutura das Especialidades
Cada especialidade possui requisitos específicos definidos pela Divisão:
- Requisitos teóricos (conhecimento).
- Requisitos práticos (habilidades).
- Projetos ou trabalhos de conclusão.

### 3.2 Organizando uma Especialidade
1. Verifique os requisitos oficiais no cartão da Divisão.
2. Planeje quantas aulas serão necessárias.
3. Liste os materiais e recursos necessários.
4. Cadastre a turma no sistema.
5. Defina datas e comunique aos interessados.

### 3.3 Eventos de Especialidades
Organize "Sábados de Especialidades" para trabalhar várias de uma vez:
- Convide especialistas de fora (mecânicos, cozinheiros, etc.).
- Agrupe especialidades relacionadas (ex: todas de Arte).
- Prepare os materiais com antecedência.
- Registre tudo no sistema após o evento.

## 4. Avaliações

### 4.1 Formas de Avaliar
- **Prova Escrita**: Para conteúdos teóricos.
- **Prova Prática**: Para habilidades manuais.
- **Trabalhos**: Relatórios, projetos, pesquisas.
- **Demonstração**: Apresentação individual.
- **Quizzes Online**: Use o sistema de Quizzes do CantinhoMDA.

### 4.2 Aprovação em Lote
Quando toda a turma for avaliada:
1. Acesse a classe ou especialidade no sistema.
2. Use a função "Lançamento em Lote".
3. Selecione os alunos aprovados.
4. Marque os requisitos concluídos.
5. Confirme a aprovação.

### 4.3 Alunos com Dificuldade
- Identifique quem está atrasado.
- Ofereça reforço individual ou em pequenos grupos.
- Adapte a avaliação para necessidades especiais (com autorização da diretoria).
- Nunca "empurre" um aluno que não está pronto.

## 5. Materiais Didáticos

### 5.1 Fontes Oficiais
- Manual de Classes da Divisão Sul-Americana.
- Cartões de Especialidades oficiais.
- Materiais disponibilizados no portal da União/Associação.
- Recursos baixados do site oficial dos Desbravadores.

### 5.2 Materiais Próprios
Você pode criar:
- Apresentações em PowerPoint.
- Vídeos explicativos.
- Jogos e atividades lúdicas.
- Resumos e apostilas.
Compartilhe estes materiais no sistema para outros instrutores.

### 5.3 Recursos Audiovisuais
- Use projetor quando disponível.
- Vídeos do YouTube podem complementar (prévia análise).
- Fotos reais ilustram melhor que desenhos.

## 6. Investidura

### 6.1 Preparação
- Verifique no sistema quem completou 100% da classe.
- Confirme se todas as especialidades obrigatórias foram feitas.
- Gere a lista de investidura oficial.

### 6.2 Cerimônia
- Organize ensaio prévio com os investidandos.
- Prepare os certificados e insígnias.
- Registre a investidura no sistema após a cerimônia.
        `
    },
    {
        id: 'parents',
        title: 'Guia dos Pais e Responsáveis',
        icon: Heart,
        color: 'text-red-600 bg-red-50',
        description: 'Como acompanhar a vida do seu filho no clube, manter documentos atualizados e facilitar a comunicação.',
        content: `
# Guia Completo para Pais e Responsáveis

## 1. Bem-vindo ao CantinhoMDA!

Este guia foi criado para ajudar você a acompanhar a vida do seu filho(a) no Clube de Desbravadores ou Aventureiros através do nosso sistema digital.

### 1.1 Seu Primeiro Acesso
- Você recebeu um e-mail com suas credenciais de acesso.
- Na primeira vez, será solicitado alterar a senha.
- Complete seu perfil com telefone e foto para facilitar a comunicação.

### 1.2 O que você pode fazer no sistema
- Acompanhar o progresso do seu filho nas classes e especialidades.
- Ver a posição no Ranking do clube.
- Verificar frequência nas reuniões.
- Pagar mensalidades e taxas de eventos.
- Manter a Ficha Médica atualizada.
- Assinar autorizações digitais para eventos.
- Comunicar-se com a diretoria do clube.

## 2. Acompanhando o Progresso

### 2.1 O Dashboard
Ao fazer login, você verá um painel com:
- Resumo da situação do seu filho (frequência, pontos, classes).
- Próximos eventos e datas importantes.
- Mensalidades em aberto.
- Avisos importantes do clube.

### 2.2 Classes Regulares
Seu filho está matriculado em uma "classe" de acordo com a idade:
- **Aventureiros (6-9 anos)**: Abelhinhas Laboriosas, Luminares, Edificadores, Mãos Ajudadoras.
- **Desbravadores (10-15 anos)**: Amigo, Companheiro, Pesquisador, Pioneiro, Excursionista, Guia.

Cada classe tem requisitos que devem ser cumpridos ao longo do ano:
- Requisitos espirituais (estudo bíblico, memorização).
- Requisitos práticos (acampamento, habilidades manuais).
- Especialidades obrigatórias.

### 2.3 Como você pode ajudar em casa
- **Memorização**: Ajude a decorar o Voto, Lei e Lema.
- **Leitura**: Incentive a leitura do livro do ano.
- **Devocional**: Faça o culto em família regularmente.
- **Requisitos práticos**: Auxilie com itens que podem ser feitos em casa.
- **Pergunte**: "O que você aprendeu no clube hoje?"

### 2.4 Especialidades
São "matérias extras" que desenvolvem habilidades específicas:
- Algumas são obrigatórias para a classe do ano.
- Outras são opcionais e podem ser escolhidas por interesse.
- Muitas podem ser praticadas em família!

Exemplos de especialidades para fazer em casa:
- Culinária, Arte Culinária, Panificação
- Vida de Jesus, Heróis da Fé
- Jardinagem, Horta Caseira
- Artesanato, Costura, Crochê

## 3. Sistema de Ranking

### 3.1 Como Funciona
O ranking é uma forma positiva de motivar os membros:
- Pontos são ganhos por presença, uniforme, requisitos completados e participação.
- O ranking é zerado todo ano para dar chances iguais.
- NÃO é uma competição negativa - todos podem alcançar boas posições.

### 3.2 O que dá pontos
- Presença na reunião: 10 pontos
- Uniforme completo: até 20 pontos
- Trazer Bíblia: 5 pontos
- Requisito aprovado: 5 pontos
- Especialidade concluída: 10 pontos
- Eventos especiais: pontos definidos pela diretoria

### 3.3 Como incentivar
- Celebre as conquistas do seu filho.
- Ajude a manter a frequência alta.
- Garanta que o uniforme esteja sempre completo.
- Não pressione por posições - valorize o esforço.

## 4. Financeiro

### 4.1 Mensalidades
O clube cobra uma mensalidade para cobrir:
- Seguro de vida/acidentes de todos os membros.
- Materiais didáticos e de atividades.
- Manutenção de equipamentos (barracas, utensílios).
- Taxas à Associação/Missão.

Como pagar:
1. Acesse "Financeiro" no menu.
2. Veja as mensalidades em aberto.
3. Copie a chave Pix e faça a transferência.
4. O sistema identifica o pagamento em até 24 horas.
5. O comprovante fica salvo na sua conta.

### 4.2 Taxas de Eventos
Acampamentos e eventos especiais podem ter taxas adicionais:
- Você será notificado quando houver evento pago.
- Veja o valor e a data limite de pagamento.
- O pagamento funciona igual às mensalidades.
- Parcelamentos devem ser acordados com a tesouraria.

### 4.3 Inadimplência
- Mensalidades atrasadas podem bloquear inscrição em eventos.
- Em caso de dificuldade financeira, converse com a diretoria.
- O clube pode ter fundos de auxílio para casos específicos.

## 5. Documentos Obrigatórios

### 5.1 Ficha Médica
É o documento mais importante para a segurança do seu filho:

**Obrigatório preencher:**
- Tipo sanguíneo
- Alergias (alimentares, medicamentosas, picadas de inseto)
- Medicamentos de uso contínuo (nome, dosagem, horários)
- Doenças crônicas (asma, diabetes, epilepsia, etc.)
- Vacinas em dia
- Plano de saúde (se tiver)
- Contatos de emergência (pelo menos 2 números)

**Importante:**
- A ficha tem validade de 1 ano.
- O sistema avisa quando precisa ser renovada.
- Sem ficha completa, seu filho NÃO pode participar de acampamentos.
- Atualize imediatamente se houver mudança de saúde.

### 5.2 Autorizações
Para eventos externos (acampamentos, passeios), você precisa autorizar:
- O sistema envia notificação quando há autorização pendente.
- Leia as informações do evento (local, data, o que levar).
- Clique em "Autorizar Participação".
- Sua assinatura digital fica registrada com data e hora.
- Sem autorização, seu filho NÃO poderá participar.

## 6. Comunicação

### 6.1 Canais de Comunicação
- **Sistema**: Avisos oficiais e notificações importantes.
- **WhatsApp**: Grupo do clube e da unidade para comunicados rápidos.
- **Telefone**: Para emergências e assuntos urgentes.

### 6.2 Com quem falar
- **Sobre requisitos e progresso**: Conselheiro da unidade.
- **Sobre classes e especialidades**: Instrutor responsável.
- **Sobre financeiro**: Tesoureiro(a) do clube.
- **Sobre documentos e cadastro**: Secretário(a).
- **Sobre eventos e geral**: Diretor(a) do clube.

### 6.3 Reuniões de Pais
O clube organiza reuniões periódicas com pais:
- Antes do início do ano: apresentação do calendário anual.
- Antes de acampamentos: orientações importantes.
- Antes de investiduras: verificação de requisitos.
Sua participação é fundamental!

## 7. Dicas Importantes

### 7.1 Para o sucesso do seu filho
- Mantenha a frequência alta - faltas prejudicam o aprendizado.
- Garanta que o uniforme esteja sempre completo e limpo.
- Ajude com os requisitos de casa.
- Pergunte sobre o que ele está aprendendo.
- Celebre cada conquista, por menor que seja.

### 7.2 Uniforme Completo
Verifique antes de cada reunião:
- Camisa oficial (com emblemas costurados corretos)
- Calça/saia oficial
- Cinto na posição correta
- Lenço (limpo e passado)
- Sapato preto engraxado
- Bíblia e/ou hinário
- Caderno e caneta

### 7.3 Para Acampamentos
Comece a preparar com uma semana de antecedência:
- Verifique a lista "O que levar" no sistema.
- Marque o nome do seu filho em TODOS os pertences.
- Prepare medicamentos em embalagens etiquetadas.
- Assine a autorização no sistema.
- Confira se a Ficha Médica está atualizada.
        `
    }
];



export function HelpModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const { user } = useAuth();
    const isAdmin = ['OWNER', 'ADMIN', 'MASTER', 'DIRECTOR'].includes(user?.role || '');

    const [activeTab, setActiveTab] = useState<'GUIDE' | 'MANUALS' | 'FAQ'>('GUIDE');
    const [searchTerm, setSearchTerm] = useState('');
    const [manualSearchTerm, setManualSearchTerm] = useState('');

    // FAQ State
    const [faqOpenItems, setFaqOpenItems] = useState<string[]>([]);

    // Manual State
    const [selectedManual, setSelectedManual] = useState<typeof MANUALS_LIBRARY[0] | null>(null);

    const { data: faqs = [], isLoading } = useQuery<FAQ[]>({
        queryKey: ['faqs', isAdmin],
        queryFn: async () => {
            const params = isAdmin ? '?all=true' : '';
            const response = await api.get(`/faqs${params}`);
            return response.data;
        },
        enabled: isOpen && activeTab === 'FAQ'
    });

    const toggleFaqItem = (id: string) => {
        setFaqOpenItems(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    // Determine User Guide Content based on Role
    let currentGuide = PATHFINDER_GUIDE; // Default
    if (isAdmin) currentGuide = ADMIN_GUIDE;
    else if (user?.role === 'COUNSELOR') currentGuide = COUNSELOR_GUIDE;
    else if (user?.role === 'INSTRUCTOR') currentGuide = INSTRUCTOR_GUIDE;
    else if (user?.role === 'PARENT') currentGuide = PARENT_GUIDE;

    // Filter Manuals
    const filteredManuals = MANUALS_LIBRARY.filter(m =>
        m.title.toLowerCase().includes(manualSearchTerm.toLowerCase()) ||
        m.description.toLowerCase().includes(manualSearchTerm.toLowerCase())
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Central de Ajuda & Manuais">
            <div className="space-y-4 h-[75vh] flex flex-col">
                {/* Tabs Header */}
                <div className="flex border-b border-slate-200">
                    <button
                        onClick={() => { setActiveTab('GUIDE'); setSelectedManual(null); }}
                        className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'GUIDE' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    >
                        Guia do Menu
                    </button>
                    <button
                        onClick={() => { setActiveTab('MANUALS'); setSelectedManual(null); }}
                        className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'MANUALS' ? 'border-orange-600 text-orange-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    >
                        Biblioteca de Manuais
                    </button>
                    <button
                        onClick={() => { setActiveTab('FAQ'); setSelectedManual(null); }}
                        className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'FAQ' ? 'border-green-600 text-green-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    >
                        Dúvidas (FAQ)
                    </button>
                </div>

                {/* Content Body */}
                <div className="flex-1 overflow-hidden relative">

                    {/* TAB 1: GUIDE (Contextual) */}
                    {activeTab === 'GUIDE' && (
                        <div className="h-full overflow-y-auto pr-2 custom-scrollbar space-y-6 pt-2">
                            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-4 flex items-start gap-3">
                                <HelpCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                                <div>
                                    <p className="text-sm text-blue-800 font-bold">Olá, {user?.name.split(' ')[0]}!</p>
                                    <p className="text-xs text-blue-600">
                                        Identificamos seu perfil como <span className="font-bold">{ROLE_TRANSLATIONS[user?.role || ''] || user?.role}</span>.
                                        Abaixo está o guia rápido dos menus que você tem acesso.
                                    </p>
                                </div>
                            </div>

                            {currentGuide.map((section) => (
                                <div key={section.category}>
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 px-1">{section.category}</h3>
                                    <div className="space-y-3">
                                        {section.items.map((item) => (
                                            <div key={item.title} className="bg-white border border-slate-100 rounded-xl p-4 hover:border-blue-200 transition-colors shadow-sm">
                                                <h4 className="font-bold text-slate-800 text-sm mb-1 text-lg flex items-center gap-2">
                                                    {item.title}
                                                </h4>
                                                <p className="text-sm text-slate-600 mb-4 italic">{item.desc}</p>
                                                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                                                    <p className="text-[10px] font-bold text-slate-500 mb-3 uppercase tracking-wide flex items-center gap-1">
                                                        <FileText className="w-3 h-3" /> COMO USAR:
                                                    </p>
                                                    <ol className="relative border-l border-slate-200 ml-2 space-y-4">
                                                        {item.steps.map((step, idx) => (
                                                            <li key={idx} className="ml-4">
                                                                <div className="absolute w-2 h-2 bg-blue-500 rounded-full -left-1 mt-1.5 border border-white"></div>
                                                                <span className="text-sm text-slate-700 leading-relaxed block">{step}</span>
                                                            </li>
                                                        ))}
                                                    </ol>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* TAB 2: MANUALS (Library) */}
                    {activeTab === 'MANUALS' && (
                        <div className="h-full flex flex-col">
                            {!selectedManual ? (
                                <>
                                    <div className="mb-4">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                                            <input
                                                type="text"
                                                placeholder="Buscar manual..."
                                                value={manualSearchTerm}
                                                onChange={(e) => setManualSearchTerm(e.target.value)}
                                                className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all outline-none"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 gap-4 overflow-y-auto pr-2 pb-4">
                                        {filteredManuals.map((manual) => (
                                            <div
                                                key={manual.id}
                                                onClick={() => setSelectedManual(manual)}
                                                className="bg-white border border-slate-200 rounded-xl p-4 cursor-pointer hover:shadow-md hover:border-orange-300 transition-all group"
                                            >
                                                <div className="flex items-start gap-4">
                                                    <div className={`p-3 rounded-lg ${manual.color}`}>
                                                        <manual.icon className="w-6 h-6" />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-slate-800 text-lg group-hover:text-orange-600 transition-colors">
                                                            {manual.title}
                                                        </h3>
                                                        <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                                                            {manual.description}
                                                        </p>
                                                        <span className="mt-3 inline-block text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded">
                                                            Ler Manual Completo →
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <div className="h-full flex flex-col bg-white rounded-xl overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300">
                                    <div className="flex items-center gap-2 p-2 border-b border-slate-100 mb-2">
                                        <button
                                            onClick={() => setSelectedManual(null)}
                                            className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition-colors text-xs font-bold flex items-center gap-1"
                                        >
                                            ← Voltar para Lista
                                        </button>
                                        <h3 className="font-bold text-slate-800 ml-auto pr-2">{selectedManual.title}</h3>
                                    </div>
                                    <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-slate-50 rounded-lg mx-2 mb-2">
                                        <div className="prose prose-sm prose-slate max-w-none">
                                            {selectedManual.content.split('\n').map((line, i) => {
                                                if (line.trim().startsWith('# ')) return <h1 key={i} className="text-2xl font-bold text-blue-900 mb-4 mt-6 pb-2 border-b border-blue-200">{line.replace('# ', '')}</h1>;
                                                if (line.trim().startsWith('## ')) return <h2 key={i} className="text-lg font-bold text-slate-800 mb-3 mt-5">{line.replace('## ', '')}</h2>;
                                                if (line.trim().startsWith('- ')) return <li key={i} className="ml-4 text-slate-700 mb-1">{line.replace('- ', '')}</li>;
                                                if (line.trim() === '') return <br key={i} />;
                                                return <p key={i} className="text-slate-600 mb-2 leading-relaxed">{line}</p>;
                                            })}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB 3: FAQ */}
                    {activeTab === 'FAQ' && (
                        <div className="h-full flex flex-col">
                            <div className="relative sticky top-0 bg-white pb-2 z-10">
                                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Pesquisar nas perguntas frequentes..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:bg-white transition-all outline-none"
                                />
                            </div>
                            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar pt-2">
                                {isLoading ? (
                                    <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                                        <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin mb-4" />
                                        <p className="text-sm">Carregando perguntas...</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {faqs.filter(f =>
                                            f.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                            f.answer.toLowerCase().includes(searchTerm.toLowerCase())
                                        ).map(faq => (
                                            <div key={faq.id} className="border border-slate-200 rounded-xl overflow-hidden hover:border-green-300 transition-colors">
                                                <button onClick={() => toggleFaqItem(faq.id)} className="w-full text-left p-4 font-bold text-sm flex justify-between items-center bg-white hover:bg-slate-50 transition-colors text-slate-700">
                                                    {faq.question}
                                                    {faqOpenItems.includes(faq.id) ? <ChevronUp className="w-4 h-4 text-green-600" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                                                </button>
                                                {faqOpenItems.includes(faq.id) && (
                                                    <div className="p-4 text-sm text-slate-600 bg-slate-50 border-t border-slate-100 leading-relaxed">
                                                        {faq.answer}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                        {faqs.length === 0 && !isLoading && <p className="text-center text-slate-400 py-8 text-sm">Nenhuma pergunta encontrada.</p>}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </Modal>
    );
}
