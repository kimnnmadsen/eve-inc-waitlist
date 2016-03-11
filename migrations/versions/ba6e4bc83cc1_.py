"""empty message

Revision ID: ba6e4bc83cc1
Revises: 2e56087b8ba7
Create Date: 2016-03-06 11:13:27.860000

"""

# revision identifiers, used by Alembic.
revision = 'ba6e4bc83cc1'
down_revision = '2e56087b8ba7'

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

def upgrade():
    ### commands auto generated by Alembic - please adjust! ###
    op.create_table('feedback',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('user', sa.Integer(), nullable=True),
    sa.Column('likes', sa.Boolean(), nullable=True),
    sa.Column('comment', mysql.TEXT(), nullable=True),
    sa.ForeignKeyConstraint(['user'], ['characters.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_feedback_user'), 'feedback', ['user'], unique=True)
    ### end Alembic commands ###


def downgrade():
    ### commands auto generated by Alembic - please adjust! ###
    op.drop_index(op.f('ix_feedback_user'), table_name='feedback')
    op.drop_table('feedback')
    ### end Alembic commands ###