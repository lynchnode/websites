import { generateProjectPaths, getProjects } from '@utils/projectUtils'
import { getAdminLayout } from '@layouts/admin'
import { useEffect, useState, useRef } from 'react'
import axios from 'axios'
import { DeleteOutlined, MinusCircleOutlined, PlusOutlined } from '@ant-design/icons'
import { Button, Form, Input, Space, Skeleton, Modal } from 'antd'
import { useRouter } from 'next/router'

const type = 'mainnet'
const { TextArea } = Input

const Project = ({ project }) => {
	const router = useRouter()
	const [currentProject, setCurrentProject] = useState()
	const projectsRef = useRef()
	const [loading, setLoading] = useState(true)
	const id = project.id
	const [form] = Form.useForm()

	useEffect(() => {
		const fetchData = async () => {
			try {
				const response = await axios.get('/api/github/read')
				setCurrentProject(response.data[type][id])
				projectsRef.current = response.data
				form.setFieldsValue(response.data[type][id])
				setLoading(false)
			} catch (err) {
				console.log(err)
			}
		}

		fetchData()
	}, [router])

	const updateProject = (type, projectName, newData) => {
		let updatedProjects = { ...projectsRef.current }
		let updatedTypeProjects = { ...updatedProjects[type] }

		updatedTypeProjects[projectName] = newData
		updatedProjects[type] = updatedTypeProjects

		projectsRef.current = updatedProjects
	}

	const onFinish = async values => {
		const userFields = {}
		if (values.userFields) {
			values.userFields.forEach(field => {
				userFields[field.name] = field.value
			})
		}

		const newValues = { ...values, ...userFields }
		delete newValues.userFields

		updateProject('mainnet', id, newValues)

		try {
			const response = await axios.post('/api/github/update', projectsRef.current)

			if (response.status === 200) {
				alert('Update successful')
			} else {
				alert('Update failed')
			}
		} catch (error) {
			alert(error)
		}
	}

	const removeField = fieldName => {
		Modal.confirm({
			title: 'Confirm delete',
			content: 'Are you sure you want to delete this field?',
			okText: 'Yes',
			okType: 'danger',
			cancelText: 'No',
			onOk() {
				form.setFieldsValue({
					[fieldName]: undefined
				})

				setCurrentProject(prevState => {
					const newState = { ...prevState }
					delete newState[fieldName]
					return newState
				})
			},
			onCancel() {
				console.log('Cancel')
			}
		})
	}

	const onFinishFailed = errorInfo => {
		console.log('Failed:', errorInfo)
	}

	return (
		<>
			<h1 className='text-xl md:text-3xl font-semibold m-2'>
				{id.charAt(0).toUpperCase() + id.slice(1)}:{' '}
				<span className={`${type === 'mainnet' ? 'text-blue-500' : 'text-green-500'}`}>{type}</span>
			</h1>
			{loading ? (
				<Skeleton active />
			) : (
				<Form
					form={form}
					onFinish={onFinish}
					onFinishFailed={onFinishFailed}
					autoComplete='on'
					layout='horizontal'
					className='min-w-[70vw] lg:min-w-[45vw] bg-white dark:bg-zinc-900 p-3 md:p-7 rounded-xl border-solid border-[1px]  border-slate-200 hover:border-slate-300 transition-all'
				>
					{Object.entries(currentProject)
						.sort()
						.map(([field, value]) => (
							<Space
								key={field}
								style={{ display: 'flex', marginBottom: 3, width: '100%', gap: '12px' }}
								align='start'
							>
								<Form.Item label={field} name={field} key={field}>
									<TextArea
										autoSize={{
											minRows: 1,
											maxRows: 6
										}}
										className='min-w-[50vw] lg:min-w-[40vw]'
									/>
								</Form.Item>
								<Button onClick={() => removeField(field)} icon={<DeleteOutlined />}></Button>
							</Space>
						))}
					<Form.List name='userFields'>
						{(fields, { add, remove }) => (
							<>
								{fields.map(field => (
									<Space key={field.key} style={{ display: 'flex', marginBottom: 8 }} align='start'>
										<Form.Item
											{...field}
											name={[field.name, 'name']}
											fieldKey={[field.fieldKey, 'name']}
											rules={[{ required: true, message: 'Missing field name' }]}
										>
											<Input placeholder='Field Name' />
										</Form.Item>
										<Form.Item
											{...field}
											name={[field.name, 'value']}
											fieldKey={[field.fieldKey, 'value']}
											rules={[{ required: true, message: 'Missing field value' }]}
										>
											<Input placeholder='Field Value' />
										</Form.Item>
										<MinusCircleOutlined onClick={() => remove(field.name)} />
									</Space>
								))}
								<Form.Item>
									<Button type='dashed' onClick={() => add()} block icon={<PlusOutlined />}>
										Add Field
									</Button>
								</Form.Item>
							</>
						)}
					</Form.List>

					<Form.Item>
						<div className='flex justify-center gap-4'>
							<Button type='primary' htmlType='submit' className='min-w-[20%]'>
								Submit
							</Button>
						</div>
					</Form.Item>
				</Form>
			)}
		</>
	)
}

export async function getStaticPaths() {
	const paths = generateProjectPaths(type)
	return { paths, fallback: 'blocking' }
}

export async function getStaticProps({ params }) {
	const projects = getProjects(type)
	const project = projects.find(p => p.id === params.projectName)
	return { props: { project }, revalidate: 1 }
}

Project.getLayout = getAdminLayout
export default Project
