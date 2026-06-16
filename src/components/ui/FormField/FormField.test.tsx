import { render, screen } from '@testing-library/react'
import { FormField } from './FormField'

describe('FormField', () => {
   it('отображает текст лейбла', () => {
      render(<FormField htmlFor="test" label="Имя"><input id="test" /></FormField>)
      expect(screen.getByText(/Имя/)).toBeInTheDocument()
   })

   it('отображает звёздочку для обязательного поля', () => {
      const { container } = render(
         <FormField htmlFor="test" label="Имя" required><input id="test" /></FormField>,
      )
      expect(container.querySelector('label')).toHaveTextContent('*')
   })

   it('не отображает звёздочку для необязательного поля', () => {
      const { container } = render(
         <FormField htmlFor="test" label="Имя"><input id="test" /></FormField>,
      )
      expect(container.querySelector('label')).not.toHaveTextContent('*')
   })

   it('отображает сообщение об ошибке', () => {
      render(
         <FormField htmlFor="test" label="Имя" error="Введите имя">
            <input id="test" />
         </FormField>,
      )
      expect(screen.getByText('Введите имя')).toBeInTheDocument()
   })

   it('не отображает блок ошибки при отсутствии ошибки', () => {
      render(<FormField htmlFor="test" label="Имя"><input id="test" /></FormField>)
      expect(screen.queryByRole('paragraph')).not.toBeInTheDocument()
   })

   it('связывает лейбл с полем ввода через htmlFor', () => {
      render(
         <FormField htmlFor="email-input" label="Email">
            <input id="email-input" />
         </FormField>,
      )
      expect(screen.getByLabelText(/Email/)).toBeInTheDocument()
   })

   it('отображает дочерний элемент', () => {
      render(
         <FormField htmlFor="test" label="Поиск">
            <input id="test" placeholder="Введите запрос" />
         </FormField>,
      )
      expect(screen.getByPlaceholderText('Введите запрос')).toBeInTheDocument()
   })
})
