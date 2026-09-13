import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { InfoButton } from "./InfoButton";

describe("InfoButton: диалог с дополнительным контекстом", () => {
  it("открывает нижнюю панель с текстом details по клику", async () => {
    const user = userEvent.setup();
    render(<InfoButton details="Дополнительный контекст вопроса." />);

    const button = screen.getByRole("button", { name: "Подробнее о вопросе" });
    await user.click(button);

    expect(screen.getByText("Дополнительный контекст вопроса.")).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("закрывается по клавише Escape и возвращает фокус на кнопку", async () => {
    const user = userEvent.setup();
    render(<InfoButton details="Дополнительный контекст вопроса." />);

    const button = screen.getByRole("button", { name: "Подробнее о вопросе" });
    await user.click(button);
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await user.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(button).toHaveFocus();
  });

  it("закрывается по кнопке закрытия", async () => {
    const user = userEvent.setup();
    render(<InfoButton details="Текст." />);

    await user.click(screen.getByRole("button", { name: "Подробнее о вопросе" }));
    await user.click(screen.getByRole("button", { name: "Закрыть" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
