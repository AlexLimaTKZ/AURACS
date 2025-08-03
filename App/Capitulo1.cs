using System;
using System.Threading;

public class Capitulo1
{
    public void Executar()
    {
        // Usaremos cores para diferenciar a narração, a fala da AURA e as ações do usuário.
        Console.Title = "Crônicas da Nebulosa - Capítulo 1";

        // --- INÍCIO DA HISTÓRIA ---
        Console.ForegroundColor = ConsoleColor.Yellow;
        Console.WriteLine("Você acorda abruptamente com o som estridente de um alarme. As luzes de emergência vermelhas pulsam na escuridão da cabine da 'Nebulosa'.");
        Console.WriteLine("A sua cabeça dói. O último som de que se lembra é o de metal se contorcendo durante um salto hiperespacial turbulento.");
        Console.ResetColor();
        Console.WriteLine(); // Espaçamento
        Thread.Sleep(3000); // Pausa para leitura

        // --- FALA DA AURA --- 
        Console.ForegroundColor = ConsoleColor.Cyan;
        Console.WriteLine("[AURA]: Kael, que bom que você acordou. Tivemos... um problema. A energia primária está em nível crítico.");
        Console.WriteLine("[AURA]: Meus sistemas de controle direto foram danificados. Para interagir comigo e com a nave, você precisará usar o terminal de comando com a sintaxe C#.");
        Console.WriteLine("[AURA]: Vamos começar. Primeiro, precisamos saber o nível exato de energia. Declare uma variável inteira chamada 'nivelDeEnergia' e atribua a ela o valor que estou lendo dos sensores: 25.");
        Console.ResetColor();
        Console.WriteLine();

        // --- INTERAÇÃO DO USUÁRIO (Lição 1: Variáveis) ---
        Console.ForegroundColor = ConsoleColor.White;
        Console.WriteLine("Sua Tarefa: Declare a variável. Digite o código C# abaixo e pressione Enter:");
        Console.ForegroundColor = ConsoleColor.Green;
        Console.WriteLine("int nivelDeEnergia = 25;");
        Console.CursorVisible = true;
        string inputUsuario = Console.ReadLine() ?? "";
        Console.CursorVisible = false;

        // Verificação simples (em um projeto real, seria mais robusto)
        if (inputUsuario.Trim() != "int nivelDeEnergia = 25;")
        {
            Console.ForegroundColor = ConsoleColor.Red;
            Console.WriteLine("\n[AURA]: Hmm, a sintaxe não parece correta. Lembre-se: tipo, nome, sinal de igual, valor e ponto e vírgula. Tente novamente mais tarde.");
            // Em um jogo real, aqui teria um loop para tentar de novo.
            return; // Fim do programa por simplicidade
        }

        int nivelDeEnergia = 25; // A variável é declarada aqui para o escopo do if
        Console.ForegroundColor = ConsoleColor.Yellow;
        Console.ForegroundColor = ConsoleColor.Cyan;
        Console.WriteLine("\n[AURA]: Correto. A variável foi criada. Agora, vamos exibir o valor para confirmar.");
        Console.ResetColor();

        Console.ForegroundColor = ConsoleColor.White;
        Console.WriteLine("Sua Tarefa: Use Console.WriteLine para mostrar o valor. Digite o código:");
        Console.ForegroundColor = ConsoleColor.Green;
        Console.WriteLine("Console.WriteLine(\"Nível de energia: \" + nivelDeEnergia + \"%\");");
        Console.CursorVisible = true;
        inputUsuario = Console.ReadLine() ?? "";
        Console.CursorVisible = false;

        if (inputUsuario.Trim() != "Console.WriteLine(\"Nível de energia: \" + nivelDeEnergia + \"%\");")
        {
            Console.ForegroundColor = ConsoleColor.Red;
            Console.WriteLine("\n[AURA]: Hmm, a sintaxe não parece correta. Lembre-se: classe, método, parênteses, texto, ponto e vírgula. Tente novamente mais tarde.");
            // Em um jogo real, aqui teria um loop para tentar de novo.
            return; // Fim do programa por simplicidade
        }

        Console.ForegroundColor = ConsoleColor.Yellow;
        Console.WriteLine("\n--- SAÍDA DO CONSOLE DA NAVE ---");
        // Aqui usamos a variável de verdade para mostrar o conceito
        Console.WriteLine("Nível de energia: " + nivelDeEnergia + "%");
        Console.WriteLine("---------------------------------\n");
        Console.ResetColor();

        Thread.Sleep(2000);

        // --- INTERAÇÃO DO USUÁRIO (Lição 2: if/else) ---
        Console.ForegroundColor = ConsoleColor.Cyan;
        Console.WriteLine("[AURA]: 25% é muito perigoso. Precisamos tomar uma decisão. Podemos desviar a energia auxiliar para os Escudos ou para o Suporte de Vida.");
        Console.WriteLine("[AURA]: Esta é uma decisão crítica, uma escolha condicional. Em C#, usamos 'if' e 'else' para isso.");
        Console.WriteLine("[AURA]: Digite '1' para desviar para os Escudos ou '2' para o Suporte de Vida.");
        Console.ResetColor();

        Console.ForegroundColor = ConsoleColor.White;
        Console.Write("Sua decisão (1 ou 2): ");
        Console.CursorVisible = true;
        string escolha = Console.ReadLine() ?? "";
        Console.CursorVisible = false;
        Console.WriteLine();

        Console.ForegroundColor = ConsoleColor.Yellow;
        Console.WriteLine("--- CÓDIGO C# QUE VOCÊ ESTÁ CONSTRUINDO ---");
        Console.ForegroundColor = ConsoleColor.Green;
        // Mostra o código que a decisão do usuário representa
        if (escolha == "1")
        {
            Console.WriteLine("if (escolha == \"1\") {");
            Console.WriteLine("    // Desvia energia para os escudos");
            Console.WriteLine("    Console.WriteLine(\"Energia desviada para os escudos. O ar ficará rarefeito, mas estamos protegidos da radiação.\");");
            Console.WriteLine("}");
            Console.WriteLine("else {");
            Console.WriteLine("    // Mantém energia no suporte de vida");
            Console.WriteLine("}");

            Console.ForegroundColor = ConsoleColor.Yellow;
            Console.WriteLine("\n--- RESULTADO ---");
            Console.WriteLine("Energia desviada para os escudos. O ar ficará rarefeito, mas estamos protegidos da radiação.");

        }
        else if (escolha == "2")
        {
            Console.WriteLine("if (escolha == \"1\") {");
            Console.WriteLine("    // Desvia energia para os escudos");
            Console.WriteLine("}");
            Console.WriteLine("else {");
            Console.WriteLine("    // Mantém energia no suporte de vida");
            Console.WriteLine("    Console.WriteLine(\"Energia mantida no suporte de vida. O ar está estável, mas os escudos estão inoperantes.\");");
            Console.WriteLine("}");

            Console.ForegroundColor = ConsoleColor.Yellow;
            Console.WriteLine("\n--- RESULTADO ---");
            Console.WriteLine("Energia mantida no suporte de vida. O ar está estável, mas os escudos estão inoperantes.");
        }
        else
        {
            Console.ForegroundColor = ConsoleColor.Red;
            Console.WriteLine("[AURA]: Escolha inválida. O sistema não reagiu.");
        }
        Console.ResetColor();
        Console.WriteLine("\nFim do Capítulo 1... Continua...");
    }
}