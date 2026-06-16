import { fireEvent, render, screen } from '@testing-library/react'
import { Button } from './Button'

describe('Button', () => {
   it('отображает текст кнопки', () => {
      render(<Button>Создать</Button>)
      expect(screen.getByRole('button', { name: 'Создать' })).toBeInTheDocument()
   })

   it('по умолчанию имеет тип button', () => {
      render(<Button>Нажми</Button>)
      expect(screen.getByRole('button')).toHaveAttribute('type', 'button')
   })

   it('принимает тип submit', () => {
      render(<Button type="submit">Отправить</Button>)
      expect(screen.getByRole('button')).toHaveAttribute('type', 'submit')
   })

   it('вызывает onClick при клике', () => {
      const handleClick = jest.fn()
      render(<Button onClick={handleClick}>Кликни</Button>)
      fireEvent.click(screen.getByRole('button'))
      expect(handleClick).toHaveBeenCalledTimes(1)
   })

   it('применяет атрибут disabled', () => {
      render(<Button disabled>Нажми</Button>)
      expect(screen.getByRole('button')).toBeDisabled()
   })

   it('применяет дополнительный className', () => {
      render(<Button className="my-class">Кнопка</Button>)
      expect(screen.getByRole('button')).toHaveClass('my-class')
   })

   it('рендерит вариант secondary', () => {
      render(<Button variant="secondary">Отмена</Button>)
      expect(screen.getByRole('button', { name: 'Отмена' })).toBeInTheDocument()
   })

   it('рендерит вариант danger', () => {
      render(<Button variant="danger">Удалить</Button>)
      expect(screen.getByRole('button', { name: 'Удалить' })).toBeInTheDocument()
   })
})
