import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import Home from './pages/Home'
import Recipes from './pages/Recipes'
import RecipeDetail from './pages/RecipeDetail'
import RecipeForm from './pages/RecipeForm'
import Ingredients from './pages/Ingredients'
import Suggestions from './pages/Suggestions'
import History from './pages/History'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/"                   element={<Home />} />
          <Route path="/recipes"            element={<Recipes />} />
          <Route path="/recipes/new"        element={<RecipeForm />} />
          <Route path="/recipes/:id"        element={<RecipeDetail />} />
          <Route path="/recipes/:id/edit"   element={<RecipeForm />} />
          <Route path="/ingredients"        element={<Ingredients />} />
          <Route path="/ingredients/new"    element={<Ingredients />} />
          <Route path="/suggestions"        element={<Suggestions />} />
          <Route path="/history"            element={<History />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
