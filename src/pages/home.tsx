import { useNavigate } from "react-router-dom";
import Text from "../components/text";
import Button from "../components/button";
import Card from "../components/card";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="max-w-4xl w-full">
        <Card shadow="lg" padding="lg">
          <div className="flex flex-col gap-8 text-center">
            <div className="flex flex-col gap-4">
              <Text as="h1" variant="heading-lg" className="text-gray-400">
                Pesquisa de Satisfação Hospitalar
              </Text>
              <Text variant="body-lg" className="text-gray-300">
                Sua opinião é fundamental para melhorarmos continuamente nossos serviços
              </Text>
            </div>

            <div className="flex flex-col gap-4">
              <Text variant="heading-sm" className="text-gray-400">
                Selecione o formulário
              </Text>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card shadow="sm" padding="md" className="flex flex-col gap-4">
                  <div className="w-16 h-16 bg-blue-light rounded-full flex items-center justify-center mx-auto">
                    <Text variant="heading-md" className="text-blue-base">
                      📋
                    </Text>
                  </div>
                  <Text variant="heading-sm" className="text-gray-400">
                    Formulário 1
                  </Text>
                  <Text variant="body-sm" className="text-gray-300">
                    Pesquisa de Satisfação e Experiência do Paciente
                  </Text>
                  <Text variant="body-md" className="text-gray-300">
                    Avalie o atendimento geral, enfermagem, equipe médica e sua experiência durante a internação
                  </Text>
                  <Button onClick={() => navigate("/survey")} className="mt-auto">
                    Iniciar Formulário 1
                  </Button>
                </Card>

                <Card shadow="sm" padding="md" className="flex flex-col gap-4">
                  <div className="w-16 h-16 bg-green-light rounded-full flex items-center justify-center mx-auto">
                    <Text variant="heading-md" className="text-green-base">
                      🏥
                    </Text>
                  </div>
                  <Text variant="heading-sm" className="text-gray-400">
                    Formulário 2
                  </Text>
                  <Text variant="body-sm" className="text-gray-300">
                    Pesquisa de Infraestrutura e Cuidados
                  </Text>
                  <Text variant="body-md" className="text-gray-300">
                    Avalie a infraestrutura, equipamentos, acomodação, nutrição, comunicação e segurança do paciente
                  </Text>
                  <Button
                    variant="secondary"
                    onClick={() => navigate("/survey2")}
                    className="mt-auto"
                  >
                    Iniciar Formulário 2
                  </Button>
                </Card>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <Card shadow="sm" padding="md" className="flex flex-col gap-4">
                <div className="w-16 h-16 bg-green-light rounded-full flex items-center justify-center mx-auto">
                  <Text variant="heading-md" className="text-green-base">
                    📊
                  </Text>
                </div>
                <Text variant="heading-sm" className="text-gray-400">
                  Área Administrativa
                </Text>
                <Text variant="body-md" className="text-gray-300">
                  Acesse o painel de controle para visualizar e analisar as respostas de ambos os formulários
                </Text>
                <Button variant="outline" onClick={() => navigate("/login")}>
                  Fazer Login
                </Button>
              </Card>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <Text variant="body-sm" className="text-gray-300">
                Sistema de Gestão de Pesquisas de Satisfação
              </Text>
              <Text variant="caption" className="text-gray-300 mt-2">
                Desenvolvido seguindo as melhores práticas de arquitetura e clean code
              </Text>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}