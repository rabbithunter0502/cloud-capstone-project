import * as React from 'react'
import { Form, Button, TextArea } from 'semantic-ui-react'
import Auth from '../auth/Auth'
import { getTodos, getUploadUrl, patchTodo, uploadFile } from '../api/todos-api'
import { Todo } from '../types/Todo'

enum UploadState {
  NoUpload,
  FetchingPresignedUrl,
  UploadingFile,
}

interface EditTodoProps {
  match: {
    params: {
      todoId: string
    }
  }
  auth: Auth
}

interface EditTodoState {
  file: any
  uploadState: UploadState,
  todo: Todo | undefined,
  description: string
}

export class EditTodo extends React.PureComponent<
  EditTodoProps,
  EditTodoState
> {
  state: EditTodoState = {
    file: undefined,
    uploadState: UploadState.NoUpload,
    todo: undefined,
    description: ''
  }

  async componentDidMount() {
    try {
      const todos = await getTodos(this.props.auth.getIdToken())
      const todoId = this.props.match.params.todoId;
      const todo = todos.find(t => t.todoId === todoId);
      this.setState({
        todo,
        description: todo?.description || ''
      })
    } catch (e) {
      alert(`Failed to fetch todos: ${e.message}`)
    }
  }

  handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    this.setState({
      file: files[0]
    })
  }

  handleDescriptionChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    this.setState({ description: event.target.value })
  }

  handleSubmit = async (event: React.SyntheticEvent) => {
    event.preventDefault()

    try {
      const todoId = this.props.match.params.todoId;
      const todo = this.state.todo;
      if (this.state.file) {
        this.setUploadState(UploadState.FetchingPresignedUrl)
        const uploadUrl = await getUploadUrl(this.props.auth.getIdToken(), todoId)

        this.setUploadState(UploadState.UploadingFile)
        await uploadFile(uploadUrl, this.state.file)
        alert('File was uploaded!')
      }

      if (todo) {
        await patchTodo(this.props.auth.getIdToken(), todoId, {
          name: `${todo.name}`,
          dueDate: todo.dueDate,
          done: !todo.done,
          description: this.state.description
        })
        alert('Todo was updated!')
      }

    } catch (e: any) {
      alert('Could not upload a file: ' + e?.message)
    } finally {
      this.setUploadState(UploadState.NoUpload)
    }
  }

  setUploadState(uploadState: UploadState) {
    this.setState({
      uploadState
    })
  }

  render() {
    return (
      <div style={{
        background: "#fbfbfbc4",
        border: "1px solid rgba(34,36,38,.15)",
        padding: "15px",
        boxShadow: "0 1px 2px 0 rgb(34 36 38 / 15%)",
        borderRadius: "5px" }}>
        <h1>Edit note</h1>

        <Form onSubmit={this.handleSubmit}>
          <Form.Field>
            <label>File</label>
            <input
              type="file"
              accept="image/*"
              placeholder="Image to upload"
              onChange={this.handleFileChange}
            />
          </Form.Field>
          <label>Description</label>
          <TextArea placeholder='Tell us more'
                    value={this.state.description}
                    onChange={this.handleDescriptionChange}
                    style={{ marginBottom: "15px" }} />
          {this.renderButton()}
        </Form>
      </div>
    )
  }

  renderButton() {

    return (
      <div>
        {this.state.uploadState === UploadState.FetchingPresignedUrl && <p>Uploading image metadata</p>}
        {this.state.uploadState === UploadState.UploadingFile && <p>Uploading file</p>}
        <Button
          loading={this.state.uploadState !== UploadState.NoUpload}
          type="submit"
        >
          Upload
        </Button>
      </div>
    )
  }
}
